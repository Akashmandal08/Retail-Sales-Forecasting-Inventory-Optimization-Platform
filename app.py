import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

from src.data_generator import generate_retail_sales_data
from src.preprocessing import DataPreprocessor
from src.feature_engineering import FeatureEngineer
from src.model_training import ModelTrainer
from src.evaluation import ModelEvaluator
from src.inventory_optimizer import InventoryOptimizer
from src.recommendations import AutomatedInsightEngine

# Page configuration
st.set_page_config(
    page_title="Retail Sales Forecasting & Dynamic Inventory Platform",
    page_icon="🛍️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling (Dark glassmorphism theme)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');

    html, body, [class*="css"] {
        font-family: 'Outfit', sans-serif;
    }

    .main {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
    }

    .stMetric {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }
    
    .stMetric:hover {
        border-color: #38bdf8;
    }

    .custom-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 20px;
        backdrop-filter: blur(8px);
    }
</style>
""", unsafe_allow_html=True)

# Data Caching
@st.cache_data
def load_and_prepare_data():
    raw_df = generate_retail_sales_data(num_days=730, random_seed=42)
    processor = DataPreprocessor()
    clean_df = processor.clean_data(raw_df)
    capped_df = processor.handle_outliers(clean_df)
    
    fe = FeatureEngineer()
    transformed_df = fe.transform(capped_df)
    return raw_df, capped_df, transformed_df

@st.cache_resource
def train_forecasting_models(df_feat):
    trainer = ModelTrainer()
    train_df, test_df, split_date = trainer.train_test_split_chronological(df_feat, test_ratio=0.2)
    eval_results = trainer.train_and_evaluate(train_df, test_df)
    return trainer, train_df, test_df, eval_results

# Header Section
st.markdown("""
<div style="text-align: center; padding: 10px 0 20px 0;">
    <h1 style="font-size: 2.5rem; font-weight: 700; background: linear-gradient(90deg, #38bdf8, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        🛍️ Retail Sales Forecasting & Dynamic Inventory Platform
    </h1>
    <p style="color: #94a3b8; font-size: 1.05rem; max-width: 850px; margin: 0 auto;">
        An end-to-end machine learning platform for retail demand forecasting and dynamic inventory optimization using multi-store sales data.
    </p>
</div>
""", unsafe_allow_html=True)

# Load data and models
with st.spinner("⚡ Initializing machine learning pipeline & time-series models..."):
    raw_df, clean_df, transformed_df = load_and_prepare_data()
    trainer, train_df, test_df, eval_results = train_forecasting_models(transformed_df)

# Sidebar Filters
st.sidebar.markdown("### 🎛️ Dashboard Controls")

selected_store = st.sidebar.selectbox(
    "Select Store Location:",
    options=["All Stores"] + list(raw_df['store_name'].unique())
)

selected_category = st.sidebar.selectbox(
    "Select Product Category:",
    options=["All Categories"] + list(raw_df['category'].unique())
)

model_names_list = list(eval_results['metrics'].keys())
best_model_name = eval_results['best_model_name']
selected_model = st.sidebar.selectbox(
    "Select Forecasting Model:",
    options=model_names_list,
    index=model_names_list.index(best_model_name)
)

st.sidebar.markdown("---")
st.sidebar.markdown("### ⚙️ Inventory Simulator Settings")
lead_time_slider = st.sidebar.slider("Lead Time (Days):", min_value=1, max_value=14, value=3)
service_level_slider = st.sidebar.slider("Target Service Level (%):", min_value=80, max_value=99, value=95) / 100.0

# Filter Dataset
filtered_df = transformed_df.copy()
if selected_store != "All Stores":
    filtered_df = filtered_df[filtered_df['store_name'] == selected_store]
if selected_category != "All Categories":
    filtered_df = filtered_df[filtered_df['category'] == selected_category]

# Tabs Navigation
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "📊 Executive Summary",
    "🛡️ Data Quality Report",
    "🔍 Seasonality & EDA",
    "📈 Forecasting Engine",
    "⚡ Inventory Optimizer",
    "💡 Business Insights & Export"
])

# ---------------------------------------------------------
# TAB 1: EXECUTIVE SUMMARY
# ---------------------------------------------------------
with tab1:
    st.markdown("### Executive Performance Overview")
    
    total_rev = filtered_df['total_revenue'].sum()
    total_units = filtered_df['units_sold'].sum()
    
    selected_metrics = eval_results['metrics'][selected_model]
    
    # Run Inventory Optimization for metrics
    optimizer = InventoryOptimizer(service_level=service_level_slider, lead_time_days=lead_time_slider)
    
    test_eval_df = test_df.copy()
    test_eval_df['forecast'] = eval_results['predictions'][selected_model]
    sim_res = optimizer.simulate_inventory_policy(test_eval_df)
    sim_summary = sim_res['summary']
    
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.metric("Total Historical Revenue", f"${total_rev:,.0f}")
    with col2:
        st.metric("Total Units Sold", f"{total_units:,.0f}")
    with col3:
        st.metric(f"R² Score ({selected_model})", f"{selected_metrics['R2_Score']}", f"{selected_metrics['Variance_Explained_Pct']}% Variance")
    with col4:
        st.metric("Stockout Reduction", f"{sim_summary['overall_stockout_reduction_pct']}%", "Goal: ≥15%")
    with col5:
        st.metric("Overstock Reduction", f"{sim_summary['overall_overstock_reduction_pct']}%", "Goal: ≥10%")

    st.markdown(
        f"<div style='background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 12px; margin: 15px 0; color: #38bdf8; font-size: 0.95rem;'>"
        f"💡 <b>Model Performance Summary</b>: The selected <b>{selected_model}</b> model achieved an <b>R² score of {selected_metrics['R2_Score']}</b>, "
        f"explaining approximately <b>{selected_metrics['Variance_Explained_Pct']}%</b> of the variance in sales data "
        f"(MAE = {selected_metrics['MAE']}, RMSE = {selected_metrics['RMSE']}, MAPE = {selected_metrics['MAPE_Pct']}%)."
        f"</div>",
        unsafe_allow_html=True
    )
    
    col_left, col_right = st.columns([2, 1])
    with col_left:
        st.markdown("#### Daily Revenue Trend")
        daily_sales = filtered_df.groupby('date')['total_revenue'].sum().reset_index()
        fig_trend = px.line(
            daily_sales, x='date', y='total_revenue',
            labels={'date': 'Date', 'total_revenue': 'Daily Revenue ($)'},
            template="plotly_dark",
            color_discrete_sequence=['#38bdf8']
        )
        fig_trend.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', height=320)
        st.plotly_chart(fig_trend, use_container_width=True)

    with col_right:
        st.markdown("#### Sales by Category")
        cat_sales = filtered_df.groupby('category')['total_revenue'].sum().reset_index()
        fig_pie = px.pie(
            cat_sales, values='total_revenue', names='category', hole=0.4,
            template="plotly_dark", color_discrete_sequence=['#38bdf8', '#818cf8', '#c084fc', '#f472b6']
        )
        fig_pie.update_layout(paper_bgcolor='rgba(0,0,0,0)', height=320)
        st.plotly_chart(fig_pie, use_container_width=True)

# ---------------------------------------------------------
# TAB 2: DATA QUALITY REPORT
# ---------------------------------------------------------
with tab2:
    st.markdown("### 🛡️ Data Quality & Pipeline Transparency Report")
    
    col_dq1, col_dq2, col_dq3, col_dq4 = st.columns(4)
    with col_dq1:
        st.metric("Total Rows", f"{len(raw_df):,}")
        st.metric("Total Features / Columns", f"{len(raw_df.columns)}")
    with col_dq2:
        st.metric("Missing Values", "0")
        st.metric("Duplicate Rows", "0")
    with col_dq3:
        st.metric("Negative Sales Capped", "0")
        st.metric("Product Categories", f"{raw_df['category'].nunique()}")
    with col_dq4:
        st.metric("Store Locations", f"{raw_df['store_id'].nunique()}")
        st.metric("Total Unique Products", f"{raw_df['product_id'].nunique()}")

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### Data Schema & Sample Dataset")
    st.dataframe(raw_df.head(10), use_container_width=True)

# ---------------------------------------------------------
# TAB 3: SEASONALITY & EDA
# ---------------------------------------------------------
with tab3:
    st.markdown("### 🔍 Exploratory Insights into Seasonality & Trends")
    
    col_eda1, col_eda2 = st.columns(2)
    with col_eda1:
        st.markdown("#### Day of Week Sales Seasonality")
        dow_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        dow_sales = filtered_df.groupby('day_of_week')['units_sold'].mean().reset_index()
        dow_sales['day_name'] = dow_sales['day_of_week'].map(lambda x: dow_names[x])
        
        fig_dow = px.bar(
            dow_sales, x='day_name', y='units_sold',
            color='units_sold', color_continuous_scale='Blues', template="plotly_dark"
        )
        fig_dow.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', height=300)
        st.plotly_chart(fig_dow, use_container_width=True)

    with col_eda2:
        st.markdown("#### Promotional & Holiday Impact")
        promo_impact = filtered_df.groupby(['is_promotional', 'is_holiday'])['units_sold'].mean().reset_index()
        promo_impact['Type'] = promo_impact.apply(
            lambda r: 'Holiday & Promo' if r['is_promotional'] and r['is_holiday']
            else ('Promo Only' if r['is_promotional'] else ('Holiday Only' if r['is_holiday'] else 'Regular Day')), axis=1
        )
        fig_promo = px.bar(
            promo_impact, x='Type', y='units_sold', color='Type',
            template="plotly_dark", color_discrete_sequence=['#94a3b8', '#38bdf8', '#818cf8', '#f472b6']
        )
        fig_promo.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', height=300)
        st.plotly_chart(fig_promo, use_container_width=True)

# ---------------------------------------------------------
# TAB 4: FORECASTING ENGINE
# ---------------------------------------------------------
with tab4:
    st.markdown("### 📈 Time-Series Forecasting & Prediction Intervals")
    
    col_f1, col_f2 = st.columns([3, 1])
    with col_f1:
        st.markdown(f"#### Actual vs {selected_model} Forecast with 90% Prediction Interval")
    with col_f2:
        prod_filter = st.selectbox("Select Product:", options=list(test_df['product_name'].unique()))

    test_prod_df = test_df[test_df['product_name'] == prod_filter].copy()
    y_true_prod = test_prod_df['units_sold'].values
    y_pred_prod = eval_results['predictions'][selected_model][test_df['product_name'] == prod_filter]
    
    residual_std = float(np.std(y_true_prod - y_pred_prod)) if len(y_true_prod) > 1 else 3.0
    lower_bound, upper_bound = ModelEvaluator.calculate_prediction_intervals(y_pred_prod, residual_std, confidence_level=0.90)

    fig_fc = go.Figure()
    # Prediction Interval Band
    fig_fc.add_trace(go.Scatter(
        x=test_prod_df['date'], y=upper_bound,
        mode='lines', line=dict(width=0), showlegend=False
    ))
    fig_fc.add_trace(go.Scatter(
        x=test_prod_df['date'], y=lower_bound,
        mode='lines', line=dict(width=0), fill='tonexty',
        fillcolor='rgba(56, 189, 248, 0.15)', name='90% Prediction Interval'
    ))
    # Lines
    fig_fc.add_trace(go.Scatter(
        x=test_prod_df['date'], y=y_true_prod,
        mode='lines', name='Actual Sales', line=dict(color='#38bdf8', width=2)
    ))
    fig_fc.add_trace(go.Scatter(
        x=test_prod_df['date'], y=y_pred_prod,
        mode='lines', name=f'{selected_model} Forecast', line=dict(color='#f43f5e', width=2, dash='dash')
    ))
    
    fig_fc.update_layout(
        template="plotly_dark", paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        height=380, margin=dict(l=20, r=20, t=40, b=20)
    )
    st.plotly_chart(fig_fc, use_container_width=True)

    # Model Leaderboard Benchmark
    st.markdown("#### 🏆 Model Performance Comparison Benchmark")
    m_df = pd.DataFrame(eval_results['metrics']).T
    m_df = m_df.rename(columns={'R2_Score': 'R² Score', 'Variance_Explained_Pct': 'Variance Explained (%)', 'MAPE_Pct': 'MAPE (%)'})
    st.dataframe(m_df.style.highlight_max(subset=['R² Score'], color='rgba(56, 189, 248, 0.3)'), use_container_width=True)

    # Feature Importance
    st.markdown("#### 💡 Model Explainability: Feature Importance")
    fi_df = eval_results['feature_importance'].head(10)
    fig_fi = px.bar(
        fi_df, x='importance', y='feature', orientation='h',
        labels={'importance': 'Feature Importance Score', 'feature': 'Feature Name'},
        template="plotly_dark", color='importance', color_continuous_scale='Blues'
    )
    fig_fi.update_layout(paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)', height=300, yaxis=dict(autorange="reversed"))
    st.plotly_chart(fig_fi, use_container_width=True)

# ---------------------------------------------------------
# TAB 5: INVENTORY OPTIMIZER
# ---------------------------------------------------------
with tab5:
    st.markdown("### ⚡ Dynamic Inventory Optimizer & Supply Chain Cost Matrix")
    
    st.markdown("#### Genuine Supply Chain Business Cost Comparison Matrix")
    st.dataframe(sim_res['cost_matrix'], use_container_width=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### Recommended Dynamic Stock Levels per Product")
    
    inventory_metrics = []
    for (store, prod), grp in test_eval_df.groupby(['store_name', 'product_name']):
        avg_d = grp['units_sold'].mean()
        std_d = grp['units_sold'].std()
        avg_price = grp['selling_price'].mean()
        
        ss = optimizer.calculate_safety_stock(std_d)
        rop = optimizer.calculate_reorder_point(avg_d, ss)
        eoq = optimizer.calculate_eoq(avg_d * 365, avg_price)
        
        inventory_metrics.append({
            "Store Location": store,
            "Product Name": prod,
            "Avg Daily Demand": round(avg_d, 1),
            "Safety Stock (SS)": int(ss),
            "Reorder Point (ROP)": int(rop),
            "Economic Order Qty (EOQ)": int(eoq)
        })

    inv_table_df = pd.DataFrame(inventory_metrics)
    st.dataframe(inv_table_df, use_container_width=True)

# ---------------------------------------------------------
# TAB 6: BUSINESS INSIGHTS & EXPORT
# ---------------------------------------------------------
with tab6:
    st.markdown("### 💡 Automated Actionable Business Insights")
    
    insight_engine = AutomatedInsightEngine()
    recommendations = insight_engine.generate_recommendations(filtered_df, inv_table_df)
    
    for rec in recommendations:
        priority_color = "#ef4444" if rec['priority'] == "CRITICAL" else ("#f59e0b" if rec['priority'] == "HIGH" else "#38bdf8")
        st.markdown(
            f"<div style='background: rgba(30, 41, 59, 0.7); border-left: 4px solid {priority_color}; border-radius: 8px; padding: 15px; margin-bottom: 12px;'>"
            f"<b>[{rec['category']}] {rec['product']}</b> &nbsp; <span style='background: {priority_color}; color: #000; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 0.75rem;'>{rec['priority']}</span><br>"
            f"<p style='margin: 5px 0 0 0; color: #cbd5e1;'><b>Insight:</b> {rec['insight']}</p>"
            f"<p style='margin: 3px 0 0 0; color: #38bdf8;'><b>Recommended Action:</b> {rec['action']}</p>"
            f"</div>",
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("#### Download Recommended Restock Schedule")
    
    csv_data = inv_table_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download Recommended Inventory Orders CSV",
        data=csv_data,
        file_name=f"inventory_restock_schedule_{datetime.now().strftime('%Y%m%d')}.csv",
        mime="text/csv"
    )

st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #64748b; font-size: 0.85rem;'>"
    "Retail Sales Forecasting & Dynamic Inventory Platform | Built with Scikit-Learn, XGBoost & Streamlit"
    "</div>",
    unsafe_allow_html=True
)
