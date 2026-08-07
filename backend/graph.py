import os
import logging
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable

logger = logging.getLogger(__name__)

NEO4J_URL = os.getenv("NEO4J_URL", "bolt://neo4j:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

_driver = None

def get_driver():
    global _driver
    if _driver is None:
        try:
            _driver = GraphDatabase.driver(NEO4J_URL, auth=(NEO4J_USER, NEO4J_PASSWORD))
            _driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j database")
        except ServiceUnavailable as e:
            logger.error(f"Neo4j database connection failed: {e}")
            _driver = None
    return _driver

def init_graph():
    driver = get_driver()
    if driver is None:
        logger.warning("Skipping Neo4j initialization - database not accessible")
        return False
        
    init_query = """
    // Create base general factor nodes if they do not exist
    MERGE (sl:Lifestyle {id: 'sleep', name: 'Sleep Quality'})
    MERGE (st:Vital {id: 'stress', name: 'Stress Level Index'})
    MERGE (w:Vital {id: 'weight', name: 'Body Weight'})
    MERGE (n:Lifestyle {id: 'nutrition', name: 'Nutrition Profile'})
    MERGE (a:Lifestyle {id: 'activity', name: 'Physical Activity'})
    MERGE (b:Vital {id: 'bmi', name: 'Body Mass Index (BMI)'})
    MERGE (g:Vital {id: 'glucose', name: 'Blood Glucose'})
    MERGE (bp:Vital {id: 'bp', name: 'Blood Pressure'})
    MERGE (hr:Risk {id: 'heartRisk', name: 'Heart Disease Risk'})
    MERGE (dr:Risk {id: 'diabetesRisk', name: 'Diabetes Risk'})

    // Create physiological connection weights
    MERGE (n)-[r1:GLYCEMIC_SPIKE]->(g) SET r1.weight = 0.75
    MERGE (n)-[r2:LIPID_ACCUMULATION]->(w) SET r2.weight = 0.60
    MERGE (sl)-[r3:REGULATES_CORTISOL]->(st) SET r3.weight = -0.65
    MERGE (sl)-[r4:NOCTURNAL_RELAXATION]->(bp) SET r4.weight = -0.40
    MERGE (sl)-[r5:CARDIO_REGEN]->(hr) SET r5.weight = -0.25
    MERGE (st)-[r6:SYMPATHETIC_TENSION]->(bp) SET r6.weight = 0.55
    MERGE (st)-[r7:CORTISOL_GLUCOSE]->(g) SET r7.weight = 0.35
    MERGE (st)-[r8:SLEEP_DISRUPTION]->(sl) SET r8.weight = -0.70
    MERGE (w)-[r9:BMI_NUMERATOR]->(b) SET r9.weight = 0.95
    MERGE (w)-[r10:VASCULAR_COMPRESSION]->(bp) SET r10.weight = 0.45
    MERGE (a)-[r11:VASCULAR_REHAB]->(hr) SET r11.weight = -0.50
    MERGE (a)-[r12:METABOLIC_CLEARANCE]->(dr) SET r12.weight = -0.45
    MERGE (a)-[r13:CATECHOLAMINE_CLEAR]->(st) SET r13.weight = -0.40
    MERGE (b)-[r14:INSULIN_RESIST_AMPLIFIER]->(dr) SET r14.weight = 0.50
    MERGE (b)-[r15:SYSTEMIC_VESSEL_RESIST]->(hr) SET r15.weight = 0.35
    MERGE (g)-[r16:GLYCEMIC_BURDEN]->(dr) SET r16.weight = 0.85
    MERGE (bp)-[r17:MYOCARDIAL_LOAD]->(hr) SET r17.weight = 0.70
    """
    
    try:
        with driver.session() as session:
            session.run(init_query)
            logger.info("Successfully initialized Neo4j graph schemas & relations")
            return True
    except Exception as e:
        logger.error(f"Failed to execute Neo4j initialization query: {e}")
        return False

def update_graph_vitals(username: str, name: str, data: dict, scores: dict):
    driver = get_driver()
    if driver is None:
        return False

    weight = float(data.get('weight', 70))
    height = float(data.get('height', 170))
    bmi = weight / ((height / 100.0) ** 2) if height > 0 else 0
    
    update_query = """
    // Create/Merge Patient node
    MERGE (p:Patient {username: $username})
    SET p.name = $name
    
    // Merge core vital variables values
    WITH p
    MATCH (sl:Lifestyle {id: 'sleep'}) SET sl.value = $sleep_duration, sl.score = $sleep_score
    WITH p
    MATCH (st:Vital {id: 'stress'}) SET st.value = $stress_level, st.score = $stress_score
    WITH p
    MATCH (w:Vital {id: 'weight'}) SET w.value = $weight, w.height = $height
    WITH p
    MATCH (b:Vital {id: 'bmi'}) SET b.value = $bmi
    WITH p
    MATCH (g:Vital {id: 'glucose'}) SET g.value = $glucose
    WITH p
    MATCH (bp:Vital {id: 'bp'}) SET bp.value = $bp_str
    WITH p
    MATCH (hr:Risk {id: 'heartRisk'}) SET hr.value = $heart_risk
    WITH p
    MATCH (dr:Risk {id: 'diabetesRisk'}) SET dr.value = $diabetes_risk
    
    // Connect user patient to their nodes dynamically
    WITH p
    MERGE (p)-[:HAS_LIFESTYLE]->(sl)
    MERGE (p)-[:HAS_VITAL]->(w)
    MERGE (p)-[:HAS_VITAL]->(bp)
    """
    
    params = {
        'username': username,
        'name': name,
        'sleep_duration': float(data.get('sleepDuration', 7.0)),
        'sleep_score': int(scores.get('sleepScore', 70)),
        'stress_level': float(data.get('stressLevel', 5)),
        'stress_score': int(scores.get('stressScore', 50)),
        'weight': weight,
        'height': height,
        'bmi': round(bmi, 2),
        'glucose': float(data.get('glucose', 90)),
        'bp_str': f"{int(data.get('bpSystolic', 120))}/{int(data.get('bpDiastolic', 80))}",
        'heart_risk': int(scores.get('heartRisk', 10)),
        'diabetes_risk': int(scores.get('diabetesRisk', 8))
    }
    
    try:
        with driver.session() as session:
            session.run(update_query, params)
            logger.info(f"Successfully updated Neo4j factors for user '{username}' ({name})")
            return True
    except Exception as e:
        logger.error(f"Failed to update Neo4j node properties: {e}")
        return False

def get_graph_data(username: str):
    driver = get_driver()
    if driver is None:
        return None
        
    query = """
    MATCH (n)
    WHERE NOT n:Patient OR n.username = $username
    OPTIONAL MATCH (n)-[r]->(m)
    WHERE NOT startNode(r):Patient OR startNode(r).username = $username
    RETURN collect(distinct n) as nodes, collect(distinct r) as relationships
    """
    
    try:
        with driver.session() as session:
            result = session.run(query, {"username": username})
            record = result.single()
            if not record:
                return None
                
            nodes_data = []
            for node in record["nodes"]:
                node_id = node.get("id")
                # Handle patient node representation mapping
                if "Patient" in list(node.labels):
                    node_id = "patient_node"
                    node_name = node.get("name")
                    group = "patient"
                else:
                    if not node_id:
                        continue
                    node_name = node.get("name")
                    labels = list(node.labels)
                    group = "lifestyle"
                    if "Vital" in labels:
                        group = "vital"
                    elif "Risk" in labels:
                        group = "risk"
                    
                nodes_data.append({
                    "id": node_id,
                    "name": node_name,
                    "group": group,
                    "properties": dict(node)
                })
                
            edges_data = []
            for rel in record["relationships"]:
                if not rel:
                    continue
                
                source_id = rel.nodes[0].get("id")
                if "Patient" in list(rel.nodes[0].labels):
                    source_id = "patient_node"
                    
                target_id = rel.nodes[1].get("id")
                if "Patient" in list(rel.nodes[1].labels):
                    target_id = "patient_node"
                    
                if not source_id or not target_id:
                    continue
                    
                edges_data.append({
                    "source": source_id,
                    "target": target_id,
                    "type": rel.type,
                    "weight": rel.get("weight", 0.5)
                })
                
            return {
                "nodes": nodes_data,
                "relationships": edges_data
            }
    except Exception as e:
        logger.error(f"Failed to fetch Neo4j graph records: {e}")
        return None
