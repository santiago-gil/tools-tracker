#!/usr/bin/env python3
import pandas as pd
import json

INPUT_FILE = "tool_tracker_migrated.xlsx"  # the cleaned excel you just generated
OUTPUT_FILE = "tools.json"

# Tabs (categories) to process
tabs = [
    "Website Backends",
    "Chat Tools",
    "Booking Tools",
    "User Consent Systems",
    "SEO-Marketing Companies",
    "Google Ads Integrations",
    "Galaxy Compatible"
]

all_records = []

for sheet in tabs:
    try:
        df = pd.read_excel(INPUT_FILE, sheet_name=sheet)
    except Exception as e:
        print(f"⚠️ Missing sheet {sheet}, skipping.")
        continue
    
    # Fill NA with empty str for safety
    df = df.fillna("")

    for _, row in df.iterrows():
        platform = row["Platform/Tool"]
        if not platform: 
            continue

        rec = {
            "category": sheet,
            "platform": platform,
            "gtm_ads_trackable": {
                "status": row["GTM Status"],
                "notes": row["GTM Notes"]
            },
            "ga4_trackable": {
                "status": row["GA4 Status"],
                "notes": row["GA4 Notes"]
            },
            "msa_tracking": {
                "status": row["MSA Status"],
                "notes": row["MSA Notes"]
            },
            "doc_links": [l.strip() for l in str(row["Docs Links"]).split(";") if l.strip()],
            "example_sites": [l.strip() for l in str(row["Example Sites"]).split(";") if l.strip()],
            "wcs_team_considerations": row["WCS Team Considerations"],
            "ops_notes": row["Ops Notes"],
            "sk_recommended": True if str(row["SK Recommended"]).strip().lower() == "true" else False
        }
        all_records.append(rec)

with open(OUTPUT_FILE, "w") as f:
    json.dump(all_records, f, indent=2)

print(f"✅ Exported {len(all_records)} records to {OUTPUT_FILE}")