import axios from 'axios';
import { Element } from '../types';

interface PubChemElement {
  AtomicNumber: number;
  Symbol: string;
  Name: string;
  AtomicMass: number;
  CPKHexColor: string;
  ElectronConfiguration: string;
  Electronegativity: number;
  AtomicRadius: number;
  IonizationEnergy: number;
  ElectronAffinity: number;
  OxidationStates: string;
  StandardState: string;
  MeltingPoint: number;
  BoilingPoint: number;
  Density: number;
  GroupBlock: string;
  YearDiscovered: number;
}

interface PubChemCompound {
  PropertyTable: {
    Properties: Array<{
      CID: number;
      MolecularFormula: string;
      MolecularWeight: number;
      IUPACName: string;
      CanonicalSMILES: string;
      IsomericSMILES: string;
    }>;
  };
}

class PubChemService {
  private baseURL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
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

  async getElementBySymbol(symbol: string): Promise<Partial<Element> | null> {
    const cacheKey = `element_${symbol.toLowerCase()}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/element/symbol/${symbol}/JSON`,
        { timeout: 10000 }
      );

      const pubchemData = response.data.Table.Row[0];
      const elementData = this.transformPubChemElement(pubchemData);
      
      this.setCache(cacheKey, elementData);
      return elementData;
    } catch (error) {
      console.error(`Error fetching element ${symbol} from PubChem:`, error);
      return null;
    }
  }

  async getCompoundByName(name: string): Promise<any | null> {
    const cacheKey = `compound_${name.toLowerCase()}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`,
        { timeout: 10000 }
      );

      const compoundData = response.data.PropertyTable.Properties[0];
      this.setCache(cacheKey, compoundData);
      return compoundData;
    } catch (error) {
      console.error(`Error fetching compound ${name} from PubChem:`, error);
      return null;
    }
  }

  async searchCompounds(query: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `search_${query.toLowerCase()}_${limit}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // First get CIDs
      const cidResponse = await axios.get(
        `${this.baseURL}/compound/name/${encodeURIComponent(query)}/cids/JSON?MaxRecords=${limit}`,
        { timeout: 10000 }
      );

      const cids = cidResponse.data.IdentifierList.CID.slice(0, limit);
      
      // Then get properties for these CIDs
      const propsResponse = await axios.get(
        `${this.baseURL}/compound/cid/${cids.join(',')}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`,
        { timeout: 15000 }
      );

      const compounds = propsResponse.data.PropertyTable.Properties;
      this.setCache(cacheKey, compounds);
      return compounds;
    } catch (error) {
      console.error(`Error searching compounds for ${query}:`, error);
      return [];
    }
  }

  private transformPubChemElement(pubchemData: any): Partial<Element> {
    return {
      symbol: pubchemData.Symbol,
      name: pubchemData.Name,
      atomicNumber: parseInt(pubchemData.AtomicNumber),
      atomicMass: parseFloat(pubchemData.AtomicMass),
      color: pubchemData.CPKHexColor ? `#${pubchemData.CPKHexColor}` : '#cccccc',
      electronConfiguration: pubchemData.ElectronConfiguration || '',
      electronegativity: parseFloat(pubchemData.Electronegativity) || undefined,
      atomicRadius: parseFloat(pubchemData.AtomicRadius) || undefined,
      ionizationEnergy: parseFloat(pubchemData.IonizationEnergy) || 0,
      meltingPoint: parseFloat(pubchemData.MeltingPoint) || 0,
      boilingPoint: parseFloat(pubchemData.BoilingPoint) || 0,
      density: parseFloat(pubchemData.Density) || 0,
      discoveryYear: parseInt(pubchemData.YearDiscovered) || 0,
      oxidationStates: pubchemData.OxidationStates ? 
        pubchemData.OxidationStates.split(',').map((s: string) => parseInt(s.trim())) : []
    };
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

export const pubchemService = new PubChemService();