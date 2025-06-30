import axios from 'axios';

interface ChemSpiderCompound {
  id: string;
  name: string;
  formula: string;
  molecularWeight: number;
  smiles: string;
  properties: {
    meltingPoint?: number;
    boilingPoint?: number;
    density?: number;
    solubility?: string;
  };
}

class ChemSpiderService {
  private baseURL = 'https://www.chemspider.com/InChI.asmx';
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getCache(key: string): any | null {
    if (this.isValidCache(key)) {
      return this.cache.get(key);
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  async searchCompound(name: string): Promise<ChemSpiderCompound | null> {
    const cacheKey = `compound_${name.toLowerCase()}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Note: ChemSpider requires API key registration
      // For demo purposes, we'll return mock data
      const mockCompound = this.getMockCompound(name);
      
      if (mockCompound) {
        this.setCache(cacheKey, mockCompound);
        return mockCompound;
      }

      return null;
    } catch (error) {
      console.error(`Error searching compound ${name}:`, error);
      return null;
    }
  }

  async getCompoundProperties(compoundId: string): Promise<any> {
    const cacheKey = `properties_${compoundId}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Mock implementation - replace with actual ChemSpider API calls
      const properties = {
        meltingPoint: Math.random() * 200 - 50,
        boilingPoint: Math.random() * 300 + 50,
        density: Math.random() * 2 + 0.5,
        solubility: 'Soluble in water'
      };

      this.setCache(cacheKey, properties);
      return properties;
    } catch (error) {
      console.error(`Error fetching properties for ${compoundId}:`, error);
      return null;
    }
  }

  private getMockCompound(name: string): ChemSpiderCompound | null {
    const mockDatabase = {
      'water': {
        id: 'cs_962',
        name: 'Water',
        formula: 'H2O',
        molecularWeight: 18.015,
        smiles: 'O',
        properties: {
          meltingPoint: 0,
          boilingPoint: 100,
          density: 1.0,
          solubility: 'Miscible with water'
        }
      },
      'methane': {
        id: 'cs_291',
        name: 'Methane',
        formula: 'CH4',
        molecularWeight: 16.043,
        smiles: 'C',
        properties: {
          meltingPoint: -182.5,
          boilingPoint: -161.5,
          density: 0.717,
          solubility: 'Slightly soluble in water'
        }
      },
      'sodium chloride': {
        id: 'cs_5360545',
        name: 'Sodium chloride',
        formula: 'NaCl',
        molecularWeight: 58.443,
        smiles: '[Na+].[Cl-]',
        properties: {
          meltingPoint: 801,
          boilingPoint: 1465,
          density: 2.16,
          solubility: 'Highly soluble in water'
        }
      }
    };

    return mockDatabase[name.toLowerCase()] || null;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const chemSpiderService = new ChemSpiderService();