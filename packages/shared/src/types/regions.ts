// Region-related types for PGN system

export interface State {
  name: string;
  type: 'state';
  districts: District[];
}

export interface District {
  name: string;
  type: 'district';
  cities: City[];
}

export interface City {
  name: string;
  type: 'city';
}

export interface RegionsData {
  summary: {
    total_states: number;
    total_districts: number;
    total_cities: number;
  };
  regions: State[];
}

export interface RegionSelection {
  states: string[];
  districts: string[];
  cities: string[];
}

export interface RegionFilterOptions {
  selectedStates: string[];
  selectedDistricts: string[];
  selectedCities: string[];
}

// Helper function to get all unique values
export function getAllStates(regionsData: RegionsData): string[] {
  return regionsData.regions.map(state => state.name);
}

export function getAllDistricts(regionsData: RegionsData, states?: string[]): string[] {
  const districts: string[] = [];

  regionsData.regions.forEach(state => {
    if (!states || states.includes(state.name)) {
      state.districts.forEach(district => {
        if (!districts.includes(district.name)) {
          districts.push(district.name);
        }
      });
    }
  });

  return districts;
}

export function getAllCities(regionsData: RegionsData, states?: string[], districts?: string[]): string[] {
  const cities: string[] = [];

  regionsData.regions.forEach(state => {
    if (!states || states.includes(state.name)) {
      state.districts.forEach(district => {
        if (!districts || districts.includes(district.name)) {
          district.cities.forEach(city => {
            if (!cities.includes(city.name)) {
              cities.push(city.name);
            }
          });
        }
      });
    }
  });

  return cities;
}

// Function to find districts by state
export function getDistrictsByState(regionsData: RegionsData, stateName: string): string[] {
  const state = regionsData.regions.find(s => s.name === stateName);
  return state ? state.districts.map(d => d.name) : [];
}

// Function to find cities by district (and optionally state)
export function getCitiesByDistrict(regionsData: RegionsData, districtName: string, stateName?: string): string[] {
  const cities: string[] = [];

  regionsData.regions.forEach(state => {
    if (!stateName || state.name === stateName) {
      const district = state.districts.find(d => d.name === districtName);
      if (district) {
        district.cities.forEach(city => {
          if (!cities.includes(city.name)) {
            cities.push(city.name);
          }
        });
      }
    }
  });

  return cities;
}