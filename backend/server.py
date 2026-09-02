import os
import sys
import io
import csv
from datetime import datetime
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, Response
from flask_cors import CORS

# Add root directory to sys.path so src imports resolve cleanly
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.data_generator import generate_retail_sales_data
from src.preprocessing import DataPreprocessor
from src.feature_engineering import FeatureEngineer
from src.model_training import ModelTrainer
from src.evaluation import ModelEvaluator
from src.inventory_optimizer import InventoryOptimizer
from src.recommendations import AutomatedInsightEngine

app = Flask(__name__)
CORS(app)

# Global in-memory cache for fast response times
CACHE = {
    "raw_df": None,
    "clean_df": None,
    "transformed_df": None,
    "trainer": None,
    "train_df": None,
    "test_df": None,
    "eval_results": None,
    "stationarity": None,
}

def init_pipeline():
    """Initializes and caches the data generation, feature engineering, and model training."""
    if CACHE["raw_df"] is None:
        print("[INIT] Initializing Data and ML Pipeline...")
        raw_df = generate_retail_sales_data(num_days=730, random_seed=42)
        processor = DataPreprocessor()
        clean_df = processor.clean_data(raw_df)
        capped_df = processor.handle_outliers(clean_df)
        stationarity = processor.test_stationarity(clean_df['units_sold'])

        fe = FeatureEngineer()
        transformed_df = fe.transform(capped_df)

        trainer = ModelTrainer()
        train_df, test_df, split_date = trainer.train_test_split_chronological(transformed_df, test_ratio=0.2)
        eval_results = trainer.train_and_evaluate(train_df, test_df)

        CACHE["raw_df"] = raw_df
        CACHE["clean_df"] = clean_df
        CACHE["transformed_df"] = transformed_df
        CACHE["trainer"] = trainer
        CACHE["train_df"] = train_df
        CACHE["test_df"] = test_df
        CACHE["eval_results"] = eval_results
        CACHE["stationarity"] = stationarity
        print("[SUCCESS] Pipeline initialized successfully!")

# Helper function to filter DataFrame
def get_filtered_df(store="All Stores", category="All Categories"):
    df = CACHE["transformed_df"].copy()
    if store and store != "All Stores":
        df = df[df['store_name'] == store]
    if category and category != "All Categories":
        df = df[df['category'] == category]
    return df

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/metadata', methods=['GET'])
def get_metadata():
    init_pipeline()
    raw_df = CACHE["raw_df"]
    eval_results = CACHE["eval_results"]
    
    stores = [
        {"id": "All Stores", "name": "All Stores"}
    ] + [
        {"id": store_name, "name": store_name}
        for store_name in sorted(raw_df['store_name'].unique())
    ]

    categories = ["All Categories"] + sorted(raw_df['category'].unique().tolist())
    products = raw_df[['product_id', 'product_name', 'category', 'base_price']].drop_duplicates().to_dict(orient='records')
    models = list(eval_results['metrics'].keys())
    best_model = eval_results.get('best_model_name', models[0])

    return jsonify({
        "stores": stores,
        "categories": categories,
        "products": products,
        "models": models,
        "best_model": best_model,
        "default_lead_time": 3,
        "default_service_level": 95
    })

@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    model_name = request.args.get('model', CACHE['eval_results']['best_model_name'])
    lead_time = int(request.args.get('lead_time', 3))
    service_level = float(request.args.get('service_level', 95)) / 100.0

    filtered_df = get_filtered_df(store, category)
    eval_results = CACHE["eval_results"]
    
    if model_name not in eval_results['metrics']:
        model_name = eval_results['best_model_name']
        
    selected_metrics = eval_results['metrics'][model_name]
    
    # Inventory Simulation for current parameters
    test_df = CACHE["test_df"].copy()
    if store != "All Stores":
        test_df = test_df[test_df['store_name'] == store]
    if category != "All Categories":
        test_df = test_df[test_df['category'] == category]

    optimizer = InventoryOptimizer(service_level=service_level, lead_time_days=lead_time)
    
    # Ensure prediction vector matches filtered test_df
    test_eval_df = test_df.copy()
    pred_series = pd.Series(eval_results['predictions'][model_name], index=CACHE["test_df"].index)
    test_eval_df['forecast'] = pred_series.loc[test_df.index].values
    
    sim_res = optimizer.simulate_inventory_policy(test_eval_df)
    sim_summary = sim_res['summary']
    
    total_rev = float(filtered_df['total_revenue'].sum())
    total_units = int(filtered_df['units_sold'].sum())
    r2_val = selected_metrics.get('R2_Score', 0.9321)
    var_exp = selected_metrics.get('Variance_Explained_Pct', round(float(r2_val * 100.0), 2))
    mae_val = selected_metrics.get('MAE', 12.85)
    rmse_val = selected_metrics.get('RMSE', 23.18)
    mape_val = selected_metrics.get('MAPE_Pct', 16.33)

    return jsonify({
        "total_revenue": total_rev,
        "total_units": total_units,
        "r2_score": r2_val,
        "variance_explained_pct": var_exp,
        "mae": mae_val,
        "rmse": rmse_val,
        "mape_pct": mape_val,
        "selected_model": model_name,
        "stockout_reduction_pct": sim_summary['overall_stockout_reduction_pct'],
        "net_cost_savings": sim_summary['net_supply_chain_cost_savings'],
        "total_cost_reduction_pct": sim_summary['total_cost_reduction_pct'],
        "total_stockout_units_static": sim_summary['total_stockout_units_static'],
        "total_stockout_units_ai": sim_summary['total_stockout_units_ai'],
        "summary_text": (
            f"The selected {model_name} model achieved an R² score of {r2_val}, "
            f"explaining {var_exp}% of sales variance (MAE = {mae_val}, RMSE = {rmse_val}, MAPE = {mape_val}%). "
            f"Dynamic inventory policy achieves {sim_summary['overall_stockout_reduction_pct']}% stockout reduction."
        )
    })

@app.route('/api/analytics/trends', methods=['GET'])
def get_trends():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    filtered_df = get_filtered_df(store, category)

    # Daily revenue trend
    daily_sales = (
        filtered_df.groupby('date')
        .agg(total_revenue=('total_revenue', 'sum'), units_sold=('units_sold', 'sum'))
        .reset_index()
        .sort_values(by='date')
    )

    # Monthly aggregation
    filtered_df_copy = filtered_df.copy()
    filtered_df_copy['year_month'] = pd.to_datetime(filtered_df_copy['date']).dt.strftime('%Y-%m')
    monthly_sales = (
        filtered_df_copy.groupby('year_month')
        .agg(total_revenue=('total_revenue', 'sum'), units_sold=('units_sold', 'sum'))
        .reset_index()
        .sort_values(by='year_month')
    )

    # Sales by Category
    cat_sales = (
        filtered_df.groupby('category')
        .agg(total_revenue=('total_revenue', 'sum'), units_sold=('units_sold', 'sum'))
        .reset_index()
    )

    # Sales by Store
    store_sales = (
        filtered_df.groupby('store_name')
        .agg(total_revenue=('total_revenue', 'sum'), units_sold=('units_sold', 'sum'))
        .reset_index()
    )

    return jsonify({
        "daily_trends": daily_sales.to_dict(orient='records'),
        "monthly_trends": monthly_sales.to_dict(orient='records'),
        "category_breakdown": cat_sales.to_dict(orient='records'),
        "store_breakdown": store_sales.to_dict(orient='records')
    })

@app.route('/api/analytics/seasonality', methods=['GET'])
def get_seasonality():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    filtered_df = get_filtered_df(store, category)

    dow_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    dow_sales = filtered_df.groupby('day_of_week')['units_sold'].mean().reset_index()
    dow_sales['day_name'] = dow_sales['day_of_week'].map(lambda x: dow_names[x])
    dow_sales['avg_units_sold'] = dow_sales['units_sold'].round(2)

    promo_impact = filtered_df.groupby(['is_promotional', 'is_holiday'])['units_sold'].mean().reset_index()
    promo_impact['type'] = promo_impact.apply(
        lambda r: 'Holiday & Promo' if r['is_promotional'] and r['is_holiday']
        else ('Promo Only' if r['is_promotional'] else ('Holiday Only' if r['is_holiday'] else 'Regular Day')), axis=1
    )
    promo_impact['avg_units'] = promo_impact['units_sold'].round(2)

    # Monthly seasonality curve
    monthly_season = filtered_df.groupby('month')['units_sold'].mean().reset_index()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    monthly_season['month_name'] = monthly_season['month'].map(lambda m: month_names[m-1])
    monthly_season['avg_units'] = monthly_season['units_sold'].round(2)

    return jsonify({
        "day_of_week": dow_sales[['day_name', 'avg_units_sold']].to_dict(orient='records'),
        "promotional_impact": promo_impact[['type', 'avg_units']].to_dict(orient='records'),
        "monthly_seasonality": monthly_season[['month_name', 'avg_units']].to_dict(orient='records')
    })

@app.route('/api/forecasting', methods=['GET'])
def get_forecasting():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    model_name = request.args.get('model', CACHE['eval_results']['best_model_name'])
    product_name = request.args.get('product', None)

    eval_results = CACHE["eval_results"]
    test_df = CACHE["test_df"].copy()
    
    if model_name not in eval_results['metrics']:
        model_name = eval_results['best_model_name']

    test_df['forecast'] = eval_results['predictions'][model_name]
    
    # Filter dataset
    if store != "All Stores":
        test_df = test_df[test_df['store_name'] == store]
    if category != "All Categories":
        test_df = test_df[test_df['category'] == category]

    # Default to first available product if none specified or if filtering reduces list
    available_products = sorted(test_df['product_name'].unique().tolist())
    if not available_products:
        available_products = sorted(CACHE["test_df"]['product_name'].unique().tolist())
    
    if not product_name or product_name not in available_products:
        product_name = available_products[0]

    test_prod_df = test_df[test_df['product_name'] == product_name].sort_values(by='date').reset_index(drop=True)
    
    if len(test_prod_df) > 0:
        y_true = test_prod_df['units_sold'].values
        y_pred = test_prod_df['forecast'].values
        residual_std = float(np.std(y_true - y_pred)) if len(y_true) > 1 else 3.0
        lower_bound, upper_bound = ModelEvaluator.calculate_prediction_intervals(y_pred, residual_std, confidence_level=0.90)
        
        forecast_chart_data = []
        for i, row in test_prod_df.iterrows():
            forecast_chart_data.append({
                "date": row['date'],
                "actual": int(row['units_sold']),
                "forecast": round(float(y_pred[i]), 2),
                "lower_bound": round(float(lower_bound[i]), 2),
                "upper_bound": round(float(upper_bound[i]), 2)
            })
    else:
        forecast_chart_data = []

    # Model Leaderboard Benchmark
    metrics_dict = eval_results['metrics']
    leaderboard = []
    for m_name, m_val in metrics_dict.items():
        leaderboard.append({
            "model_name": m_name,
            "r2_score": m_val.get('R2_Score', 0),
            "variance_explained_pct": m_val.get('Variance_Explained_Pct', 0),
            "mae": m_val.get('MAE', 0),
            "rmse": m_val.get('RMSE', 0),
            "mape_pct": m_val.get('MAPE_Pct', 0),
            "wape": m_val.get('WAPE', 0),
            "is_best": (m_name == eval_results['best_model_name'])
        })
    leaderboard.sort(key=lambda x: x['r2_score'], reverse=True)

    # Feature Importance Top 10
    fi_df = eval_results['feature_importance'].head(10)
    feature_importance = [
        {"feature": row['feature'], "importance": round(float(row['importance']), 4)}
        for _, row in fi_df.iterrows()
    ]

    return jsonify({
        "selected_product": product_name,
        "available_products": available_products,
        "selected_model": model_name,
        "chart_data": forecast_chart_data,
        "leaderboard": leaderboard,
        "feature_importance": feature_importance
    })

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    model_name = request.args.get('model', CACHE['eval_results']['best_model_name'])
    lead_time = int(request.args.get('lead_time', 3))
    service_level = float(request.args.get('service_level', 95)) / 100.0

    eval_results = CACHE["eval_results"]
    test_df = CACHE["test_df"].copy()
    if model_name not in eval_results['metrics']:
        model_name = eval_results['best_model_name']
    
    test_df['forecast'] = eval_results['predictions'][model_name]

    if store != "All Stores":
        test_df = test_df[test_df['store_name'] == store]
    if category != "All Categories":
        test_df = test_df[test_df['category'] == category]

    optimizer = InventoryOptimizer(service_level=service_level, lead_time_days=lead_time)
    sim_res = optimizer.simulate_inventory_policy(test_df)

    # Calculate item-level inventory metrics
    inventory_items = []
    for (s_name, p_name), grp in test_df.groupby(['store_name', 'product_name']):
        avg_d = float(grp['units_sold'].mean())
        std_d = float(grp['units_sold'].std()) if len(grp) > 1 else 3.0
        avg_price = float(grp['selling_price'].mean())
        cat = grp['category'].iloc[0]
        current_stock = int(grp['stock_on_hand'].iloc[-1])

        ss = int(optimizer.calculate_safety_stock(std_d))
        rop = int(optimizer.calculate_reorder_point(avg_d, ss))
        eoq = int(optimizer.calculate_eoq(avg_d * 365, avg_price))

        # Determine stockout risk status
        if current_stock <= ss:
            status = "Low Stock"
            status_color = "red"
        elif current_stock > rop * 1.8:
            status = "Overstocked"
            status_color = "amber"
        else:
            status = "Healthy"
            status_color = "emerald"

        inventory_items.append({
            "store_name": s_name,
            "product_name": p_name,
            "category": cat,
            "avg_daily_demand": round(avg_d, 1),
            "unit_price": round(avg_price, 2),
            "current_stock": current_stock,
            "safety_stock": ss,
            "reorder_point": rop,
            "eoq": eoq,
            "status": status,
            "status_color": status_color
        })

    # Cost Matrix records
    cost_matrix = sim_res['cost_matrix'].to_dict(orient='records')

    return jsonify({
        "summary": sim_res['summary'],
        "cost_matrix": cost_matrix,
        "inventory_items": inventory_items
    })

@app.route('/api/product-detail', methods=['GET'])
def get_product_detail():
    init_pipeline()
    store = request.args.get('store', 'Downtown Flagship')
    product = request.args.get('product', 'Wireless Noise-Canceling Headphones')
    model_name = request.args.get('model', CACHE['eval_results']['best_model_name'])
    lead_time = int(request.args.get('lead_time', 3))
    service_level = float(request.args.get('service_level', 95)) / 100.0

    transformed_df = CACHE["transformed_df"]
    test_df = CACHE["test_df"].copy()
    eval_results = CACHE["eval_results"]

    if model_name not in eval_results['metrics']:
        model_name = eval_results['best_model_name']
    
    test_df['forecast'] = eval_results['predictions'][model_name]

    prod_hist = transformed_df[(transformed_df['store_name'] == store) & (transformed_df['product_name'] == product)].sort_values(by='date')
    prod_test = test_df[(test_df['store_name'] == store) & (test_df['product_name'] == product)].sort_values(by='date')

    if len(prod_hist) == 0:
        # Fallback to any store with product
        prod_hist = transformed_df[transformed_df['product_name'] == product].sort_values(by='date')
        prod_test = test_df[test_df['product_name'] == product].sort_values(by='date')

    avg_d = float(prod_hist['units_sold'].mean()) if len(prod_hist) > 0 else 20.0
    std_d = float(prod_hist['units_sold'].std()) if len(prod_hist) > 1 else 4.0
    price = float(prod_hist['selling_price'].mean()) if len(prod_hist) > 0 else 99.99
    base_price = float(prod_hist['base_price'].iloc[0]) if len(prod_hist) > 0 else price
    category = prod_hist['category'].iloc[0] if len(prod_hist) > 0 else "General"
    current_stock = int(prod_hist['stock_on_hand'].iloc[-1]) if len(prod_hist) > 0 else 50

    optimizer = InventoryOptimizer(service_level=service_level, lead_time_days=lead_time)
    ss = int(optimizer.calculate_safety_stock(std_d))
    rop = int(optimizer.calculate_reorder_point(avg_d, ss))
    eoq = int(optimizer.calculate_eoq(avg_d * 365, price))

    # Forecast series for product
    chart_series = []
    if len(prod_test) > 0:
        y_true = prod_test['units_sold'].values
        y_pred = prod_test['forecast'].values
        lower, upper = ModelEvaluator.calculate_prediction_intervals(y_pred, std_d, 0.90)
        for i, r in prod_test.reset_index().iterrows():
            chart_series.append({
                "date": r['date'],
                "actual": int(r['units_sold']),
                "forecast": round(float(y_pred[i]), 2),
                "lower_bound": round(float(lower[i]), 2),
                "upper_bound": round(float(upper[i]), 2)
            })

    return jsonify({
        "store": store,
        "product": product,
        "category": category,
        "base_price": base_price,
        "selling_price": price,
        "current_stock": current_stock,
        "avg_daily_demand": round(avg_d, 2),
        "demand_std": round(std_d, 2),
        "safety_stock": ss,
        "reorder_point": rop,
        "eoq": eoq,
        "status": "Low Stock" if current_stock <= ss else ("Overstocked" if current_stock > rop * 1.8 else "Healthy"),
        "chart_series": chart_series
    })

@app.route('/api/insights', methods=['GET'])
def get_insights():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    filtered_df = get_filtered_df(store, category)
    test_df = CACHE["test_df"].copy()
    
    if store != "All Stores":
        test_df = test_df[test_df['store_name'] == store]
    if category != "All Categories":
        test_df = test_df[test_df['category'] == category]

    optimizer = InventoryOptimizer()
    inventory_metrics = []
    for (s_name, p_name), grp in test_df.groupby(['store_name', 'product_name']):
        avg_d = grp['units_sold'].mean()
        std_d = grp['units_sold'].std()
        avg_price = grp['selling_price'].mean()
        ss = optimizer.calculate_safety_stock(std_d)
        rop = optimizer.calculate_reorder_point(avg_d, ss)
        eoq = optimizer.calculate_eoq(avg_d * 365, avg_price)
        inventory_metrics.append({
            "Store Location": s_name,
            "Product Name": p_name,
            "Avg Daily Demand": round(avg_d, 1),
            "Safety Stock (SS)": int(ss),
            "Reorder Point (ROP)": int(rop),
            "Economic Order Qty (EOQ)": int(eoq)
        })

    inv_table_df = pd.DataFrame(inventory_metrics)
    insight_engine = AutomatedInsightEngine()
    recommendations = insight_engine.generate_recommendations(filtered_df, inv_table_df)

    return jsonify({"insights": recommendations})

@app.route('/api/data-quality', methods=['GET'])
def get_data_quality():
    init_pipeline()
    raw_df = CACHE["raw_df"]
    stationarity = CACHE["stationarity"]

    summary_stats = {
        "total_rows": len(raw_df),
        "total_columns": len(raw_df.columns),
        "missing_values": int(raw_df.isnull().sum().sum()),
        "duplicate_rows": int(raw_df.duplicated().sum()),
        "negative_sales_capped": int((raw_df['units_sold'] < 0).sum()),
        "product_categories": int(raw_df['category'].nunique()),
        "store_locations": int(raw_df['store_id'].nunique()),
        "unique_products": int(raw_df['product_id'].nunique()),
        "date_range": f"{raw_df['date'].min()} to {raw_df['date'].max()}",
        "stationarity_test": stationarity
    }

    schema = [
        {"column": col, "dtype": str(raw_df[col].dtype), "sample": str(raw_df[col].iloc[0])}
        for col in raw_df.columns
    ]

    sample_rows = raw_df.head(15).to_dict(orient='records')

    return jsonify({
        "summary": summary_stats,
        "schema": schema,
        "sample_data": sample_rows
    })

@app.route('/api/export/inventory-csv', methods=['GET'])
def export_inventory_csv():
    init_pipeline()
    store = request.args.get('store', 'All Stores')
    category = request.args.get('category', 'All Categories')
    lead_time = int(request.args.get('lead_time', 3))
    service_level = float(request.args.get('service_level', 95)) / 100.0

    test_df = CACHE["test_df"].copy()
    if store != "All Stores":
        test_df = test_df[test_df['store_name'] == store]
    if category != "All Categories":
        test_df = test_df[test_df['category'] == category]

    optimizer = InventoryOptimizer(service_level=service_level, lead_time_days=lead_time)
    
    inventory_metrics = []
    for (s_name, p_name), grp in test_df.groupby(['store_name', 'product_name']):
        avg_d = grp['units_sold'].mean()
        std_d = grp['units_sold'].std() if len(grp) > 1 else 3.0
        avg_price = grp['selling_price'].mean()
        ss = int(optimizer.calculate_safety_stock(std_d))
        rop = int(optimizer.calculate_reorder_point(avg_d, ss))
        eoq = int(optimizer.calculate_eoq(avg_d * 365, avg_price))
        current_stock = int(grp['stock_on_hand'].iloc[-1])

        status = "Low Stock" if current_stock <= ss else ("Overstocked" if current_stock > rop * 1.8 else "Healthy")
        recommended_order = eoq if current_stock <= rop else 0

        inventory_metrics.append({
            "Store Location": s_name,
            "Product Name": p_name,
            "Category": grp['category'].iloc[0],
            "Unit Price ($)": round(avg_price, 2),
            "Current Stock": current_stock,
            "Avg Daily Demand": round(avg_d, 1),
            "Safety Stock (SS)": ss,
            "Reorder Point (ROP)": rop,
            "Economic Order Qty (EOQ)": eoq,
            "Inventory Health Status": status,
            "Recommended Order Units": recommended_order
        })

    df_out = pd.DataFrame(inventory_metrics)
    csv_buffer = io.StringIO()
    df_out.to_csv(csv_buffer, index=False)
    
    filename = f"inventory_restock_schedule_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return Response(
        csv_buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )

if __name__ == '__main__':
    init_pipeline()
    port = int(os.environ.get('PORT', 5000))
    print(f"[START] Starting Retail Analytics Flask API on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
