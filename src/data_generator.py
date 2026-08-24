import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_retail_sales_data(
    start_date="2023-01-01",
    num_days=730,
    num_stores=3,
    random_seed=42
):
    """
    Generates realistic daily multi-store, multi-product retail sales dataset.
    Features included:
    - Products across 4 categories (Electronics, Apparel, Grocery, Home & Kitchen)
    - Weekly & Annual seasonality
    - Promotional discounts and marketing campaigns
    - Holiday surge factors (Black Friday, Christmas, New Year, Summer Sale)
    - Price elasticity and external index (weather, consumer confidence)
    """
    np.random.seed(random_seed)
    
    dates = pd.date_range(start=start_date, periods=num_days, freq="D")
    
    products = [
        {"id": "PROD_001", "name": "Wireless Noise-Canceling Headphones", "category": "Electronics", "base_price": 149.99, "base_demand": 45, "elasticity": 1.5},
        {"id": "PROD_002", "name": "Smart Fitness Watch", "category": "Electronics", "base_price": 199.99, "base_demand": 35, "elasticity": 1.2},
        {"id": "PROD_003", "name": "Organic Whole Milk (1 Gal)", "category": "Grocery", "base_price": 4.49, "base_demand": 210, "elasticity": 0.5},
        {"id": "PROD_004", "name": "Premium Blend Coffee Beans (2lb)", "category": "Grocery", "base_price": 18.99, "base_demand": 120, "elasticity": 0.8},
        {"id": "PROD_005", "name": "Men's Classic Cotton T-Shirt", "category": "Apparel", "base_price": 24.99, "base_demand": 95, "elasticity": 1.4},
        {"id": "PROD_006", "name": "Women's Denim Jacket", "category": "Apparel", "base_price": 69.99, "base_demand": 40, "elasticity": 1.6},
        {"id": "PROD_007", "name": "Stainless Steel Cookware Set", "category": "Home & Kitchen", "base_price": 129.99, "base_demand": 25, "elasticity": 1.1},
        {"id": "PROD_008", "name": "Ergonomic Desk Chair", "category": "Home & Kitchen", "base_price": 219.99, "base_demand": 20, "elasticity": 1.3},
    ]
    
    stores = [
        {"id": "STORE_101", "name": "Downtown Flagship", "store_multiplier": 1.35},
        {"id": "STORE_102", "name": "Suburban Mall", "store_multiplier": 1.00},
        {"id": "STORE_103", "name": "Metro Express", "store_multiplier": 0.75},
    ]
    
    records = []
    
    for date in dates:
        # Seasonality components
        day_of_week = date.dayofweek # 0=Mon, 6=Sun
        day_of_year = date.dayofyear
        month = date.month
        
        # Weekly seasonality (weekend spike)
        weekly_factor = 1.25 if day_of_week in [4, 5, 6] else 0.90
        
        # Annual seasonality (Holiday peak Q4, mid-year summer sale)
        annual_factor = 1.0 + 0.30 * np.sin(2 * np.pi * (day_of_year - 60) / 365)
        if month == 11 and date.day >= 20: # Black Friday week
            annual_factor += 0.65
        elif month == 12: # Holiday shopping
            annual_factor += 0.50
        elif month == 7 and 10 <= date.day <= 20: # Summer clearance
            annual_factor += 0.35
            
        # Is Holiday indicator
        is_holiday = 1 if (
            (month == 1 and date.day == 1) or
            (month == 7 and date.day == 4) or
            (month == 11 and 22 <= date.day <= 28 and day_of_week == 3) or # Thanksgiving
            (month == 12 and date.day in [24, 25, 31])
        ) else 0

        # Weather / Foot-traffic index
        weather_index = np.round(np.random.normal(loc=70, scale=12), 1)
        weather_factor = 1.0 + (weather_index - 70) * 0.003
        
        for store in stores:
            for prod in products:
                # Random promotional flag (~15% probability)
                is_promo = 1 if np.random.rand() < 0.15 or is_holiday else 0
                discount_pct = np.random.choice([0.10, 0.15, 0.20, 0.30]) if is_promo else 0.0
                
                selling_price = np.round(prod["base_price"] * (1.0 - discount_pct), 2)
                
                # Price elasticity effect
                price_ratio = selling_price / prod["base_price"]
                elasticity_factor = (1.0 / price_ratio) ** prod["elasticity"]
                
                # Base expected demand
                expected_demand = (
                    prod["base_demand"]
                    * store["store_multiplier"]
                    * weekly_factor
                    * annual_factor
                    * weather_factor
                    * elasticity_factor
                )
                
                # Long term growth trend (+5% per year)
                year_offset = (date.year - dates[0].year) + (day_of_year / 365.0)
                trend_factor = 1.0 + 0.05 * year_offset
                expected_demand *= trend_factor
                
                # Add Poisson noise for realistic count variation
                units_sold = int(np.random.poisson(lam=max(1, expected_demand)))
                
                # Revenue calculation
                total_revenue = np.round(units_sold * selling_price, 2)
                
                # Stock initial level simulation
                stock_on_hand = max(units_sold + np.random.randint(-5, 25), 0)
                
                records.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "store_id": store["id"],
                    "store_name": store["name"],
                    "product_id": prod["id"],
                    "product_name": prod["name"],
                    "category": prod["category"],
                    "base_price": prod["base_price"],
                    "selling_price": selling_price,
                    "discount_pct": discount_pct,
                    "is_promotional": is_promo,
                    "is_holiday": is_holiday,
                    "weather_index": weather_index,
                    "stock_on_hand": stock_on_hand,
                    "units_sold": units_sold,
                    "total_revenue": total_revenue
                })
                
    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    df = generate_retail_sales_data()
    print(f"Generated dataset shape: {df.shape}")
    print(df.head())
    df.to_csv("data/retail_sales_data.csv", index=False)
    print("Saved dataset to data/retail_sales_data.csv")
