export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          assigned_cities: string[] | null
          created_at: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_cities?: string[] | null
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_cities?: string[] | null
          created_at?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_system_logs: {
        Row: {
          created_at: string | null
          id: string
          log_type: string
          prompt: string | null
          response: string | null
          system_action: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          log_type?: string
          prompt?: string | null
          response?: string | null
          system_action?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          log_type?: string
          prompt?: string | null
          response?: string | null
          system_action?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_available: boolean
          name: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      CITY: {
        Row: {
          country_id: string
          created_at: string
          id: string
          is_available: boolean
          name: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "CITY_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "COUNTRY"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_messages: {
        Row: {
          browser_info: string | null
          consent_accepted: boolean | null
          created_at: string
          email: string
          id: string
          message: string
          name: string | null
          page_url: string | null
          screen_size: string | null
          screenshot_url: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          browser_info?: string | null
          consent_accepted?: boolean | null
          created_at?: string
          email: string
          id?: string
          message: string
          name?: string | null
          page_url?: string | null
          screen_size?: string | null
          screenshot_url?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          browser_info?: string | null
          consent_accepted?: boolean | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string | null
          page_url?: string | null
          screen_size?: string | null
          screenshot_url?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
        }
        Relationships: []
      }
      COUNTRY: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
        }
        Relationships: []
      }
      DISTRICT: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_available: boolean
          name: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "DISTRICT_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "CITY"
            referencedColumns: ["id"]
          },
        ]
      }
      DISTRICT_DATA: {
        Row: {
          air_quality: string | null
          average_park_size_sqm: number | null
          average_property_price: number | null
          average_rent_price: number | null
          average_salary: number | null
          average_sale_price_sqm: number | null
          banks_atms_count: number | null
          beauty_salons_count: number | null
          bike_lanes_km: number | null
          bike_rental_stations_count: number | null
          bus_stops_count: number | null
          cafes_restaurants_count: number | null
          cctv_count: number | null
          churches_count: number | null
          cinemas_count: number | null
          clinics_count: number | null
          commerce_rating: number | null
          coworking_spaces_count: number | null
          created_at: string
          crime_level: number | null
          data_source: string | null
          data_updated_at: string | null
          district_id: string
          education_rating: number | null
          ev_charging_stations_count: number | null
          green_spaces_percent: number | null
          grocery_stores_count: number | null
          gyms_count: number | null
          has_electricity: boolean | null
          has_gas_supply: boolean | null
          has_heating: boolean | null
          has_waste_removal: boolean | null
          has_water_supply: boolean | null
          hospitals_count: number | null
          id: string
          is_active: boolean
          kindergartens_count: number | null
          last_updated: string
          libraries_count: number | null
          markets_count: number | null
          medicine_rating: number | null
          metro_stations_count: number | null
          museums_count: number | null
          outdoor_gyms_count: number | null
          parcel_lockers_count: number | null
          parking_spots_count: number | null
          parks_count: number | null
          pet_stores_count: number | null
          pharmacies_count: number | null
          playgrounds_count: number | null
          police_stations_count: number | null
          population: number | null
          population_density: number | null
          post_offices_count: number | null
          safety_rating: number | null
          schools_count: number | null
          shopping_malls_count: number | null
          social_rating: number | null
          sports_facilities_count: number | null
          street_lighting_rating: number | null
          swimming_pools_count: number | null
          theaters_count: number | null
          tram_stops_count: number | null
          transport_average_distance_m: number | null
          transport_frequency: string | null
          transport_rating: number | null
          unemployment_rate: number | null
          universities_count: number | null
          utilities_cost_per_sqm: number | null
          utilities_quality_rating: number | null
          vet_clinics_count: number | null
        }
        Insert: {
          air_quality?: string | null
          average_park_size_sqm?: number | null
          average_property_price?: number | null
          average_rent_price?: number | null
          average_salary?: number | null
          average_sale_price_sqm?: number | null
          banks_atms_count?: number | null
          beauty_salons_count?: number | null
          bike_lanes_km?: number | null
          bike_rental_stations_count?: number | null
          bus_stops_count?: number | null
          cafes_restaurants_count?: number | null
          cctv_count?: number | null
          churches_count?: number | null
          cinemas_count?: number | null
          clinics_count?: number | null
          commerce_rating?: number | null
          coworking_spaces_count?: number | null
          created_at?: string
          crime_level?: number | null
          data_source?: string | null
          data_updated_at?: string | null
          district_id: string
          education_rating?: number | null
          ev_charging_stations_count?: number | null
          green_spaces_percent?: number | null
          grocery_stores_count?: number | null
          gyms_count?: number | null
          has_electricity?: boolean | null
          has_gas_supply?: boolean | null
          has_heating?: boolean | null
          has_waste_removal?: boolean | null
          has_water_supply?: boolean | null
          hospitals_count?: number | null
          id?: string
          is_active?: boolean
          kindergartens_count?: number | null
          last_updated?: string
          libraries_count?: number | null
          markets_count?: number | null
          medicine_rating?: number | null
          metro_stations_count?: number | null
          museums_count?: number | null
          outdoor_gyms_count?: number | null
          parcel_lockers_count?: number | null
          parking_spots_count?: number | null
          parks_count?: number | null
          pet_stores_count?: number | null
          pharmacies_count?: number | null
          playgrounds_count?: number | null
          police_stations_count?: number | null
          population?: number | null
          population_density?: number | null
          post_offices_count?: number | null
          safety_rating?: number | null
          schools_count?: number | null
          shopping_malls_count?: number | null
          social_rating?: number | null
          sports_facilities_count?: number | null
          street_lighting_rating?: number | null
          swimming_pools_count?: number | null
          theaters_count?: number | null
          tram_stops_count?: number | null
          transport_average_distance_m?: number | null
          transport_frequency?: string | null
          transport_rating?: number | null
          unemployment_rate?: number | null
          universities_count?: number | null
          utilities_cost_per_sqm?: number | null
          utilities_quality_rating?: number | null
          vet_clinics_count?: number | null
        }
        Update: {
          air_quality?: string | null
          average_park_size_sqm?: number | null
          average_property_price?: number | null
          average_rent_price?: number | null
          average_salary?: number | null
          average_sale_price_sqm?: number | null
          banks_atms_count?: number | null
          beauty_salons_count?: number | null
          bike_lanes_km?: number | null
          bike_rental_stations_count?: number | null
          bus_stops_count?: number | null
          cafes_restaurants_count?: number | null
          cctv_count?: number | null
          churches_count?: number | null
          cinemas_count?: number | null
          clinics_count?: number | null
          commerce_rating?: number | null
          coworking_spaces_count?: number | null
          created_at?: string
          crime_level?: number | null
          data_source?: string | null
          data_updated_at?: string | null
          district_id?: string
          education_rating?: number | null
          ev_charging_stations_count?: number | null
          green_spaces_percent?: number | null
          grocery_stores_count?: number | null
          gyms_count?: number | null
          has_electricity?: boolean | null
          has_gas_supply?: boolean | null
          has_heating?: boolean | null
          has_waste_removal?: boolean | null
          has_water_supply?: boolean | null
          hospitals_count?: number | null
          id?: string
          is_active?: boolean
          kindergartens_count?: number | null
          last_updated?: string
          libraries_count?: number | null
          markets_count?: number | null
          medicine_rating?: number | null
          metro_stations_count?: number | null
          museums_count?: number | null
          outdoor_gyms_count?: number | null
          parcel_lockers_count?: number | null
          parking_spots_count?: number | null
          parks_count?: number | null
          pet_stores_count?: number | null
          pharmacies_count?: number | null
          playgrounds_count?: number | null
          police_stations_count?: number | null
          population?: number | null
          population_density?: number | null
          post_offices_count?: number | null
          safety_rating?: number | null
          schools_count?: number | null
          shopping_malls_count?: number | null
          social_rating?: number | null
          sports_facilities_count?: number | null
          street_lighting_rating?: number | null
          swimming_pools_count?: number | null
          theaters_count?: number | null
          tram_stops_count?: number | null
          transport_average_distance_m?: number | null
          transport_frequency?: string | null
          transport_rating?: number | null
          unemployment_rate?: number | null
          universities_count?: number | null
          utilities_cost_per_sqm?: number | null
          utilities_quality_rating?: number | null
          vet_clinics_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "DISTRICT_DATA_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: true
            referencedRelation: "DISTRICT"
            referencedColumns: ["id"]
          },
        ]
      }
      district_filter_data: {
        Row: {
          air_quality: string | null
          average_park_size_sqm: number | null
          average_property_price: number | null
          average_rent_price: number | null
          average_salary: number | null
          average_sale_price_sqm: number | null
          banks_atms_count: number | null
          beauty_salons_count: number | null
          bike_lanes_km: number | null
          bike_rental_stations_count: number | null
          bus_stops_count: number | null
          cafes_restaurants_count: number | null
          cctv_count: number | null
          churches_count: number | null
          cinemas_count: number | null
          clinics_count: number | null
          commerce_rating: number | null
          coworking_spaces_count: number | null
          created_at: string
          crime_level: number | null
          culture_leisure_rating: number | null
          data_source: string | null
          data_updated_at: string | null
          district_id: string
          economics_rating: number | null
          education_rating: number | null
          ev_charging_stations_count: number | null
          green_spaces_percent: number | null
          grocery_stores_count: number | null
          gyms_count: number | null
          has_electricity: boolean | null
          has_gas_supply: boolean | null
          has_heating: boolean | null
          has_waste_removal: boolean | null
          has_water_supply: boolean | null
          hospitals_count: number | null
          id: string
          is_active: boolean
          kindergartens_count: number | null
          last_updated: string
          libraries_count: number | null
          markets_count: number | null
          medicine_rating: number | null
          metro_stations_count: number | null
          museums_count: number | null
          outdoor_gyms_count: number | null
          parcel_lockers_count: number | null
          parking_spots_count: number | null
          parks_count: number | null
          pet_store: number | null
          pet_stores_count: number | null
          pharmacies_count: number | null
          playgrounds_count: number | null
          police_stations_count: number | null
          population: number | null
          population_density: number | null
          post_offices_count: number | null
          safety_rating: number | null
          schools_count: number | null
          security_rating: number | null
          shopping_malls_count: number | null
          social_rating: number | null
          sports_facilities_count: number | null
          sports_rating: number | null
          street_lighting_rating: number | null
          swimming_pools_count: number | null
          theaters_count: number | null
          tram_stops_count: number | null
          transport_average_distance_m: number | null
          transport_frequency: string | null
          transport_rating: number | null
          unemployment_rate: number | null
          universities_count: number | null
          utilities_cost_per_sqm: number | null
          utilities_quality_rating: number | null
          vet_clinics_count: number | null
        }
        Insert: {
          air_quality?: string | null
          average_park_size_sqm?: number | null
          average_property_price?: number | null
          average_rent_price?: number | null
          average_salary?: number | null
          average_sale_price_sqm?: number | null
          banks_atms_count?: number | null
          beauty_salons_count?: number | null
          bike_lanes_km?: number | null
          bike_rental_stations_count?: number | null
          bus_stops_count?: number | null
          cafes_restaurants_count?: number | null
          cctv_count?: number | null
          churches_count?: number | null
          cinemas_count?: number | null
          clinics_count?: number | null
          commerce_rating?: number | null
          coworking_spaces_count?: number | null
          created_at?: string
          crime_level?: number | null
          culture_leisure_rating?: number | null
          data_source?: string | null
          data_updated_at?: string | null
          district_id: string
          economics_rating?: number | null
          education_rating?: number | null
          ev_charging_stations_count?: number | null
          green_spaces_percent?: number | null
          grocery_stores_count?: number | null
          gyms_count?: number | null
          has_electricity?: boolean | null
          has_gas_supply?: boolean | null
          has_heating?: boolean | null
          has_waste_removal?: boolean | null
          has_water_supply?: boolean | null
          hospitals_count?: number | null
          id?: string
          is_active?: boolean
          kindergartens_count?: number | null
          last_updated?: string
          libraries_count?: number | null
          markets_count?: number | null
          medicine_rating?: number | null
          metro_stations_count?: number | null
          museums_count?: number | null
          outdoor_gyms_count?: number | null
          parcel_lockers_count?: number | null
          parking_spots_count?: number | null
          parks_count?: number | null
          pet_store?: number | null
          pet_stores_count?: number | null
          pharmacies_count?: number | null
          playgrounds_count?: number | null
          police_stations_count?: number | null
          population?: number | null
          population_density?: number | null
          post_offices_count?: number | null
          safety_rating?: number | null
          schools_count?: number | null
          security_rating?: number | null
          shopping_malls_count?: number | null
          social_rating?: number | null
          sports_facilities_count?: number | null
          sports_rating?: number | null
          street_lighting_rating?: number | null
          swimming_pools_count?: number | null
          theaters_count?: number | null
          tram_stops_count?: number | null
          transport_average_distance_m?: number | null
          transport_frequency?: string | null
          transport_rating?: number | null
          unemployment_rate?: number | null
          universities_count?: number | null
          utilities_cost_per_sqm?: number | null
          utilities_quality_rating?: number | null
          vet_clinics_count?: number | null
        }
        Update: {
          air_quality?: string | null
          average_park_size_sqm?: number | null
          average_property_price?: number | null
          average_rent_price?: number | null
          average_salary?: number | null
          average_sale_price_sqm?: number | null
          banks_atms_count?: number | null
          beauty_salons_count?: number | null
          bike_lanes_km?: number | null
          bike_rental_stations_count?: number | null
          bus_stops_count?: number | null
          cafes_restaurants_count?: number | null
          cctv_count?: number | null
          churches_count?: number | null
          cinemas_count?: number | null
          clinics_count?: number | null
          commerce_rating?: number | null
          coworking_spaces_count?: number | null
          created_at?: string
          crime_level?: number | null
          culture_leisure_rating?: number | null
          data_source?: string | null
          data_updated_at?: string | null
          district_id?: string
          economics_rating?: number | null
          education_rating?: number | null
          ev_charging_stations_count?: number | null
          green_spaces_percent?: number | null
          grocery_stores_count?: number | null
          gyms_count?: number | null
          has_electricity?: boolean | null
          has_gas_supply?: boolean | null
          has_heating?: boolean | null
          has_waste_removal?: boolean | null
          has_water_supply?: boolean | null
          hospitals_count?: number | null
          id?: string
          is_active?: boolean
          kindergartens_count?: number | null
          last_updated?: string
          libraries_count?: number | null
          markets_count?: number | null
          medicine_rating?: number | null
          metro_stations_count?: number | null
          museums_count?: number | null
          outdoor_gyms_count?: number | null
          parcel_lockers_count?: number | null
          parking_spots_count?: number | null
          parks_count?: number | null
          pet_store?: number | null
          pet_stores_count?: number | null
          pharmacies_count?: number | null
          playgrounds_count?: number | null
          police_stations_count?: number | null
          population?: number | null
          population_density?: number | null
          post_offices_count?: number | null
          safety_rating?: number | null
          schools_count?: number | null
          security_rating?: number | null
          shopping_malls_count?: number | null
          social_rating?: number | null
          sports_facilities_count?: number | null
          sports_rating?: number | null
          street_lighting_rating?: number | null
          swimming_pools_count?: number | null
          theaters_count?: number | null
          tram_stops_count?: number | null
          transport_average_distance_m?: number | null
          transport_frequency?: string | null
          transport_rating?: number | null
          unemployment_rate?: number | null
          universities_count?: number | null
          utilities_cost_per_sqm?: number | null
          utilities_quality_rating?: number | null
          vet_clinics_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "district_filter_data_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: true
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      DISTRICT_FOTO: {
        Row: {
          created_at: string
          description: string | null
          district_id: string
          id: string
          is_main: boolean
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          district_id: string
          id?: string
          is_main?: boolean
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          district_id?: string
          id?: string
          is_main?: boolean
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "DISTRICT_FOTO_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "DISTRICT"
            referencedColumns: ["id"]
          },
        ]
      }
      district_geo_data: {
        Row: {
          created_at: string
          district_id: string
          geojson: Json | null
          id: string
          poi_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          district_id: string
          geojson?: Json | null
          id?: string
          poi_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          district_id?: string
          geojson?: Json | null
          id?: string
          poi_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "district_geo_data_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: true
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      district_photos: {
        Row: {
          created_at: string
          description: string | null
          district_id: string
          id: string
          is_main: boolean
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          district_id: string
          id?: string
          is_main?: boolean
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          district_id?: string
          id?: string
          is_main?: boolean
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "district_photos_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: true
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_available: boolean
          name: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_districts: {
        Row: {
          created_at: string
          district_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_districts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      field_groups: {
        Row: {
          bg_color: string | null
          icon: string | null
          id: string
          label_key: string
          sort_order: number | null
        }
        Insert: {
          bg_color?: string | null
          icon?: string | null
          id: string
          label_key: string
          sort_order?: number | null
        }
        Update: {
          bg_color?: string | null
          icon?: string | null
          id?: string
          label_key?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      fields_config: {
        Row: {
          admin_label: string
          created_at: string | null
          data_type: string
          field_code: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_visible_form: boolean | null
          is_visible_table: boolean | null
          osm_key: string | null
          osm_value: string | null
          parser_config: Json | null
          sort_order: number | null
          source_type: string
          ui_component: string | null
          ui_group: string
        }
        Insert: {
          admin_label: string
          created_at?: string | null
          data_type: string
          field_code: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_visible_form?: boolean | null
          is_visible_table?: boolean | null
          osm_key?: string | null
          osm_value?: string | null
          parser_config?: Json | null
          sort_order?: number | null
          source_type: string
          ui_component?: string | null
          ui_group: string
        }
        Update: {
          admin_label?: string
          created_at?: string | null
          data_type?: string
          field_code?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_visible_form?: boolean | null
          is_visible_table?: boolean | null
          osm_key?: string | null
          osm_value?: string | null
          parser_config?: Json | null
          sort_order?: number | null
          source_type?: string
          ui_component?: string | null
          ui_group?: string
        }
        Relationships: []
      }
      global_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          type?: string | null
        }
        Relationships: []
      }
      scraper_rules: {
        Row: {
          country_code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          item_selector: string
          max_price: number | null
          max_sqm: number | null
          min_price: number | null
          min_sqm: number | null
          platform: string
          price_regex: string
          sqm_regex: string | null
          type: string
        }
        Insert: {
          country_code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_selector: string
          max_price?: number | null
          max_sqm?: number | null
          min_price?: number | null
          min_sqm?: number | null
          platform: string
          price_regex: string
          sqm_regex?: string | null
          type: string
        }
        Update: {
          country_code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          item_selector?: string
          max_price?: number | null
          max_sqm?: number | null
          min_price?: number | null
          min_sqm?: number | null
          platform?: string
          price_regex?: string
          sqm_regex?: string | null
          type?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          en: string | null
          pl: string | null
          translation_key: string
          uk: string | null
          updated_at: string | null
        }
        Insert: {
          en?: string | null
          pl?: string | null
          translation_key: string
          uk?: string | null
          updated_at?: string | null
        }
        Update: {
          en?: string | null
          pl?: string | null
          translation_key?: string
          uk?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_date: string | null
          comparisons_count: number | null
          id: string
          searches_count: number | null
          user_id: string | null
        }
        Insert: {
          activity_date?: string | null
          comparisons_count?: number | null
          id?: string
          searches_count?: number | null
          user_id?: string | null
        }
        Update: {
          activity_date?: string | null
          comparisons_count?: number | null
          id?: string
          searches_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_comparison_history: {
        Row: {
          created_at: string | null
          districts_data: Json
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          districts_data: Json
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          districts_data?: Json
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_district_visits: {
        Row: {
          district_data: Json | null
          district_id: string | null
          id: string
          last_visited_at: string | null
          user_id: string | null
          visit_count: number | null
        }
        Insert: {
          district_data?: Json | null
          district_id?: string | null
          id?: string
          last_visited_at?: string | null
          user_id?: string | null
          visit_count?: number | null
        }
        Update: {
          district_data?: Json | null
          district_id?: string | null
          id?: string
          last_visited_at?: string | null
          user_id?: string | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_district_visits_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          comparison_count: number | null
          created_at: string | null
          favorite_district: Json | null
          id: string
          is_terms_accepted: boolean | null
          last_active: string | null
          saved_districts_count: number | null
          terms_accepted_at: string | null
          total_time_seconds: number | null
          updated_at: string | null
          user_id: string
          viewed_districts_count: number | null
        }
        Insert: {
          comparison_count?: number | null
          created_at?: string | null
          favorite_district?: Json | null
          id?: string
          is_terms_accepted?: boolean | null
          last_active?: string | null
          saved_districts_count?: number | null
          terms_accepted_at?: string | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id: string
          viewed_districts_count?: number | null
        }
        Update: {
          comparison_count?: number | null
          created_at?: string | null
          favorite_district?: Json | null
          id?: string
          is_terms_accepted?: boolean | null
          last_active?: string | null
          saved_districts_count?: number | null
          terms_accepted_at?: string | null
          total_time_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          viewed_districts_count?: number | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount: number | null
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          payment_id: string | null
          plan_name: string
          starts_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          payment_id?: string | null
          plan_name: string
          starts_at?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          cancel_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          payment_id?: string | null
          plan_name?: string
          starts_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_tracked_districts: {
        Row: {
          city: string
          country: string
          created_at: string | null
          district: string
          district_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          district: string
          district_id?: string | null
          id?: string
          user_id?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          district?: string
          district_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tracked_districts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_license: { Args: { lookup_code: string }; Returns: Json }
      add_dynamic_column: {
        Args: { col_name: string; col_type: string }
        Returns: undefined
      }
      calculate_stats_safely: { Args: never; Returns: undefined }
      check_license_date: { Args: { lookup_code: string }; Returns: string }
      force_logout_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      get_popular_district_ids: {
        Args: { city_name: string; country_name: string }
        Returns: {
          id: string
        }[]
      }
      get_popular_districts_stats: {
        Args: never
        Returns: {
          city: string
          count: number
          country: string
          name: string
        }[]
      }
      get_top_city_districts: {
        Args: { city_name: string }
        Returns: {
          city: string
          count: number
          country: string
          id: string
          name: string
        }[]
      }
      get_weekly_activity_stats: {
        Args: { uid: string }
        Returns: {
          comparisons: number
          date: string
          searches: number
        }[]
      }
      increment_user_time: { Args: { seconds_add: number }; Returns: undefined }
      is_super_admin: { Args: never; Returns: boolean }
      register_comparison_event: {
        Args: { districts_payload: Json }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      track_district_visit: {
        Args: { district_data: Json }
        Returns: undefined
      }
      track_user_activity: {
        Args: { activity_type: string }
        Returns: undefined
      }
      update_user_time: { Args: { seconds: number }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
