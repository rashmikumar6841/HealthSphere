# HealthSphere — VitalPredict

A full-stack health analytics dashboard that combines patient health inputs, risk assessment, interactive visualizations, and explainable health insights in a single interface.

## Overview

**HealthSphere (VitalPredict)** is a prototype clinical decision-support dashboard designed to help users understand how health and lifestyle factors can influence indicators such as heart risk, diabetes risk, sleep quality, and overall health.

The application provides interactive dashboards, health-input forms, what-if simulations, visual health trends, and explainable risk information.

> **Note:** This project is a prototype for software and data-analysis experimentation. It is not intended to provide medical diagnosis or replace professional medical advice.

## Key Features

* **Health Dashboard** — Displays overall health indicators, heart-risk and diabetes-risk estimates, sleep quality, stress, and other health metrics.
* **Health Input System** — Allows health and lifestyle parameters to be entered and modified for analysis.
* **What-If Simulator** — Lets users change health parameters and observe how simulated risk indicators respond.
* **Health Trends** — Visualizes historical metrics such as sleep, heart rate, and steps.
* **Explainable Risk Insights** — Includes visual representations of feature contributions and risk factors.
* **Causal Health Graph** — Interactive graph-based visualization for exploring relationships between health factors.
* **Health Passport** — Maintains versioned snapshots of patient states using cryptographic hashes.
* **Multi-language Support** — Includes an internationalization structure for supporting multiple languages.
* **Dark / Light Mode** — Responsive theme system for the application.
* **Docker Support** — Includes Docker and Docker Compose configuration for local deployment.

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Recharts
* React Flow
* Framer Motion
* Lucide React

### Backend

* Python
* FastAPI
* Uvicorn

### Data & Analytics

* Health and lifestyle datasets
* Data preprocessing with Python/Jupyter
* Risk-analysis and visualization components
* Explainability concepts using SHAP/LIME-style feature contributions

### Deployment & Development

* Docker
* Docker Compose
* Nginx
* Git/GitHub

## Application Structure

```text
HealthSphere/
├── backend/                  # Backend services
├── src/                      # React/TypeScript application
├── public/                   # Static assets
├── dataset_preprocessing.ipynb
├── *.csv                     # Health datasets
├── *.png                     # Data visualizations
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
└── VOICE_SETUP.md
```

## Main Modules

### Dashboard

Provides a consolidated view of health indicators including:

* Overall health score
* Heart-risk indicator
* Diabetes-risk indicator
* Sleep quality
* Stress-related metrics
* Historical health trends

### What-If Simulation

The simulator allows users to modify health parameters and explore how changes affect the application's calculated health indicators.

This provides an interactive way to understand relationships between different health and lifestyle variables.

### Explainable Health Analysis

The project includes visual representations of feature contributions inspired by explainability techniques such as **SHAP** and **LIME**, helping users understand which factors contribute to a particular risk estimate.

### Causal Health Graph

The application uses an interactive graph interface to represent relationships between health-related factors and allow users to explore connected factors visually.

### Health Passport

Patient-state snapshots are represented as versioned records with cryptographic hashes, providing a foundation for tracking changes to health information over time.

## Data

The repository contains datasets related to:

* Diabetes
* Heart disease
* Sleep health and lifestyle

A preprocessing notebook is included for cleaning and preparing the datasets used during development.

## Running Locally

### Prerequisites

* Node.js
* Python
* Docker (optional)

### Frontend

```bash
npm install
npm run frontend
```

### Backend

```bash
npm run backend
```

### Run Frontend and Backend Together

```bash
npm run dev
```

### Using Docker

```bash
docker compose up -d --build
```

The project also includes a Dockerfile and Nginx configuration for containerized deployment.

## Current Project Status

HealthSphere is currently a **working prototype**.

The repository also documents areas planned for further development, including:

* Secure authentication and access control
* Deeper database integration
* Integration of trained machine-learning models
* Live wearable-data synchronization
* PDF clinical-report generation
* A retrieval-augmented AI assistant

These are planned extensions rather than features currently represented as fully implemented production functionality.

## Learning & Development Focus

This project was developed to explore the intersection of:

* Full-stack application development
* Health-data visualization
* Machine learning concepts
* Explainable AI
* Interactive data analysis
* Graph-based representations
* Containerized application deployment

## Disclaimer

HealthSphere is an educational and technical prototype. Its outputs should not be interpreted as medical diagnoses, treatment recommendations, or professional medical advice.
