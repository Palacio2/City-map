import 'dotenv/config';
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { processLocalOsmData } from "../services/osmProcessor.js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  try {
    const { data: districts, error } = await supabase
      .from("districts")
      .select("id, name, cities (name)");
      
    if (error) throw error;
    if (!districts || districts.length === 0) {
      return;
    }

    const cityName = districts[0]?.cities?.name || "Bydgoszcz";
    const districtNames = districts.map(d => d.name);
    
    const PBF_FILE_PATH = "./data/kujawsko-pomorskie-260225.osm.pbf";
    
    const stats = await processLocalOsmData(PBF_FILE_PATH, districtNames, cityName);
    
    fs.writeFileSync("./debug-raw-stats.json", JSON.stringify(stats, null, 2));

    const results = districts.map(d => {
      const dbNameClean = d.name.toLowerCase().trim();
      
      const osmNameKey = Object.keys(stats).find(osmName => {
          const osmNameClean = osmName.toLowerCase().trim();
          return osmNameClean === dbNameClean || osmNameClean.includes(dbNameClean);
      });

      if (osmNameKey) {
          return {
            district_id: d.id,
            district_name: d.name,
            ...stats[osmNameKey]
         };
      } else {
         return null;
      }
    }).filter(Boolean);

    fs.writeFileSync(
      "../pending-results.json",
      JSON.stringify(results, null, 2)
    );
    
  } catch (err) {
    console.error(err.message);
  }
}

run();