import pandas as pd
import numpy as np

class AutomatedInsightEngine:
    """
    Data-Driven Automated Business Insights & Inventory Recommendation Engine.
    Generates dynamic actionable recommendations based on empirical sales data.
    """

    def generate_recommendations(self, df_sales: pd.DataFrame, inv_table: pd.DataFrame) -> list:
        recommendations = []

        # 1. Product Weekend Demand Sensitivity
        dow_sales = df_sales.groupby(['product_name', 'is_weekend'])['units_sold'].mean().unstack()
        if 1 in dow_sales.columns and 0 in dow_sales.columns:
            dow_sales['weekend_ratio'] = dow_sales[1] / (dow_sales[0] + 1e-5)
            high_weekend = dow_sales.sort_values(by='weekend_ratio', ascending=False).head(2)
            for prod_name, row in high_weekend.iterrows():
                if row['weekend_ratio'] > 1.15:
                    recommendations.append({
                        "category": "Seasonality & Buffer",
                        "product": prod_name,
                        "priority": "HIGH",
                        "insight": f"Product '{prod_name}' shows {((row['weekend_ratio']-1)*100):.1f}% higher sales on weekends.",
                        "action": "Increase safety stock buffers 2 days prior to weekends to prevent Friday-Sunday stockouts."
                    })

        # 2. High Stockout Risk Products (ROP Analysis)
        for _, row in inv_table.head(4).iterrows():
            if row['Reorder Point (ROP)'] > row['Safety Stock (SS)'] * 2:
                recommendations.append({
                    "category": "Stockout Prevention",
                    "product": row['Product Name'],
                    "priority": "CRITICAL",
                    "insight": f"High demand velocity detected at {row['Store Location']}. Reorder Point threshold is {row['Reorder Point (ROP)']} units.",
                    "action": f"Set automated purchase trigger at ROP = {row['Reorder Point (ROP)']} units with batch EOQ size = {row['Economic Order Qty (EOQ)']} units."
                })

        # 3. Promotional Price Elasticity Insight
        promo_sales = df_sales.groupby(['category', 'is_promotional'])['units_sold'].mean().unstack()
        if 1 in promo_sales.columns and 0 in promo_sales.columns:
            promo_sales['lift'] = (promo_sales[1] - promo_sales[0]) / (promo_sales[0] + 1e-5) * 100.0
            top_promo_cat = promo_sales['lift'].idxmax()
            top_lift = promo_sales['lift'].max()
            recommendations.append({
                "category": "Promotional Strategy",
                "product": f"All {top_promo_cat} Products",
                "priority": "MEDIUM",
                "insight": f"Category '{top_promo_cat}' yields a {top_lift:.1f}% volume lift during promotional campaigns.",
                "action": "Align vendor lead times before scheduled sales campaigns to avoid stockout bottlenecks."
            })

        # 4. Holding Cost & Overstock Optimization
        recommendations.append({
            "category": "Overstock Reduction",
            "product": "Overall Inventory Portfolio",
            "priority": "MEDIUM",
            "insight": "AI Dynamic Forecast ROP reduces holding costs by matching order sizes to dynamic Economic Order Quantity (EOQ).",
            "action": "Transition store purchase orders from fixed 7-day batches to dynamic EOQ sizing."
        })

        return recommendations
