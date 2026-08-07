import pandas as pd
import os

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Heart
df_h = pd.read_csv(os.path.join(base, 'cleaned_heart_disease.csv'))
print("=== HEART DISEASE ===")
print(f"Shape: {df_h.shape}")
print(f"Columns: {list(df_h.columns)}")
print(f"Target distribution:\n{df_h['target'].value_counts()}")
print(f"Dtypes:\n{df_h.dtypes}")
print(f"Sample:\n{df_h.head(2)}\n")

# Diabetes
df_d = pd.read_csv(os.path.join(base, 'cleaned_diabetes.csv'))
print("=== DIABETES ===")
print(f"Shape: {df_d.shape}")
print(f"Columns: {list(df_d.columns)}")
print(f"Target distribution:\n{df_d['Outcome'].value_counts()}")
print(f"Dtypes:\n{df_d.dtypes}")
print(f"Sample:\n{df_d.head(2)}\n")

# Sleep
df_s = pd.read_csv(os.path.join(base, 'cleaned_sleep_health.csv'))
print("=== SLEEP HEALTH ===")
print(f"Shape: {df_s.shape}")
print(f"Columns: {list(df_s.columns)}")
print(f"Target distribution:\n{df_s['Sleep Disorder'].value_counts()}")
print(f"Dtypes:\n{df_s.dtypes}")
print(f"Sample:\n{df_s.head(2)}")
