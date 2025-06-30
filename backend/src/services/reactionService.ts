import axios from 'axios';

interface ReactionInput {
  reactants: string[];
  temperature: number;
  pressure: number;
  catalyst?: string;
}

interface ReactionValidation {
  equation: string;
  reactants: string[];
  products: string[];
}

interface SimulationResult {
  products: string[];
  energyChange: number;
  equilibriumConstant: number;
  reactionRate: number;
  yieldPercentage: number;
  safetyWarnings: string[];
  mechanism: string[];
  isBalanced: boolean;
}

interface ValidationResult {
  isValid: boolean;
  isBalanced: boolean;
  errors: string[];
  suggestions: string[];
  balancedEquation?: string;
}

interface SafetyAssessment {
  hazardLevel: 'low' | 'medium' | 'high' | 'extreme';
  warnings: string[];
  precautions: string[];
  emergencyProcedures: string[];
  incompatibleSubstances: string[];
}

class ReactionService {
  private commonReactions = new Map([
    ['H2+O2', { products: ['H2O'], energyChange: -571.6, type: 'combustion' }],
    ['Na+Cl2', { products: ['NaCl'], energyChange: -822.0, type: 'synthesis' }],
    ['CH4+O2', { products: ['CO2', 'H2O'], energyChange: -890.3, type: 'combustion' }],
    ['CaCO3', { products: ['CaO', 'CO2'], energyChange: 178.3, type: 'decomposition' }],
    ['Fe+CuSO4', { products: ['FeSO4', 'Cu'], energyChange: -149.5, type: 'single-replacement' }]
  ]);

  private safetyDatabase = new Map([
    ['H2', { hazard: 'high', warnings: ['Highly flammable', 'Explosive with air'] }],
    ['O2', { hazard: 'medium', warnings: ['Supports combustion', 'Oxidizer'] }],
    ['Na', { hazard: 'extreme', warnings: ['Reacts violently with water', 'Caustic'] }],
    ['Cl2', { hazard: 'high', warnings: ['Toxic gas', 'Corrosive'] }],
    ['CH4', { hazard: 'medium', warnings: ['Flammable gas', 'Asphyxiant'] }]
  ]);

  async simulateReaction(input: ReactionInput): Promise<SimulationResult> {
    const { reactants, temperature, pressure, catalyst } = input;
    
    // Create reaction key for lookup
    const reactionKey = reactants.sort().join('+');
    const knownReaction = this.commonReactions.get(reactionKey);

    if (knownReaction) {
      return this.simulateKnownReaction(knownReaction, temperature, pressure, catalyst);
    }

    // For unknown reactions, provide estimated results
    return this.simulateUnknownReaction(reactants, temperature, pressure, catalyst);
  }

  private simulateKnownReaction(
    reaction: any, 
    temperature: number, 
    pressure: number, 
    catalyst?: string
  ): SimulationResult {
    // Temperature effect on equilibrium (Le Chatelier's principle)
    const tempFactor = temperature / 298; // Standard temperature
    const pressureFactor = pressure / 1; // Standard pressure

    // Calculate adjusted energy change
    const adjustedEnergyChange = reaction.energyChange * tempFactor;
    
    // Calculate equilibrium constant (simplified)
    const equilibriumConstant = Math.exp(-adjustedEnergyChange / (8.314 * temperature));
    
    // Calculate reaction rate (simplified Arrhenius equation)
    const activationEnergy = Math.abs(reaction.energyChange) * 0.1; // Estimate
    const reactionRate = Math.exp(-activationEnergy / (8.314 * temperature));
    
    // Calculate yield percentage
    let yieldPercentage = 85 + (equilibriumConstant > 1 ? 10 : -10);
    if (catalyst) yieldPercentage += 5; // Catalyst improves yield
    yieldPercentage = Math.min(99, Math.max(10, yieldPercentage));

    // Generate safety warnings
    const safetyWarnings = this.generateSafetyWarnings(reaction.products);

    // Generate mechanism steps
    const mechanism = this.generateMechanism(reaction.type);

    return {
      products: reaction.products,
      energyChange: adjustedEnergyChange,
      equilibriumConstant,
      reactionRate,
      yieldPercentage,
      safetyWarnings,
      mechanism,
      isBalanced: true
    };
  }

  private simulateUnknownReaction(
    reactants: string[], 
    temperature: number, 
    pressure: number, 
    catalyst?: string
  ): SimulationResult {
    // Provide estimated results for unknown reactions
    const estimatedProducts = this.predictProducts(reactants);
    const estimatedEnergyChange = Math.random() * 200 - 100; // Random between -100 and 100 kJ/mol
    
    return {
      products: estimatedProducts,
      energyChange: estimatedEnergyChange,
      equilibriumConstant: Math.random() * 10,
      reactionRate: Math.random(),
      yieldPercentage: 50 + Math.random() * 40, // 50-90%
      safetyWarnings: ['Unknown reaction - proceed with caution'],
      mechanism: ['Mechanism unknown for this reaction'],
      isBalanced: false
    };
  }

  private predictProducts(reactants: string[]): string[] {
    // Simple product prediction logic
    if (reactants.includes('O2')) {
      return ['CO2', 'H2O']; // Combustion products
    }
    if (reactants.length === 1) {
      return ['Unknown_Product_A', 'Unknown_Product_B']; // Decomposition
    }
    return ['Unknown_Product']; // Synthesis
  }

  private generateSafetyWarnings(products: string[]): string[] {
    const warnings: string[] = [];
    
    products.forEach(product => {
      const safety = this.safetyDatabase.get(product);
      if (safety) {
        warnings.push(...safety.warnings);
      }
    });

    if (warnings.length === 0) {
      warnings.push('Follow standard laboratory safety procedures');
    }

    return warnings;
  }

  private generateMechanism(reactionType: string): string[] {
    const mechanisms = {
      combustion: [
        'Initiation: Fuel molecule reacts with oxygen',
        'Propagation: Chain reaction continues',
        'Termination: Products are formed'
      ],
      synthesis: [
        'Reactants approach each other',
        'Bond formation occurs',
        'Product is stabilized'
      ],
      decomposition: [
        'Energy input breaks bonds',
        'Intermediate species form',
        'Final products separate'
      ],
      'single-replacement': [
        'More reactive metal displaces less reactive metal',
        'Electron transfer occurs',
        'New compound forms'
      ]
    };

    return mechanisms[reactionType] || ['Mechanism not available'];
  }

  async validateReaction(validation: ReactionValidation): Promise<ValidationResult> {
    const { equation, reactants, products } = validation;
    
    // Check if equation is balanced
    const isBalanced = this.checkBalance(reactants, products);
    const errors: string[] = [];
    const suggestions: string[] = [];

    if (!isBalanced) {
      errors.push('Equation is not balanced');
      suggestions.push('Balance the number of atoms on both sides');
    }

    // Check for valid chemical formulas
    const invalidFormulas = this.validateFormulas([...reactants, ...products]);
    if (invalidFormulas.length > 0) {
      errors.push(`Invalid chemical formulas: ${invalidFormulas.join(', ')}`);
      suggestions.push('Check chemical formula syntax');
    }

    // Generate balanced equation if possible
    let balancedEquation;
    if (!isBalanced) {
      balancedEquation = this.attemptBalance(equation);
    }

    return {
      isValid: errors.length === 0,
      isBalanced,
      errors,
      suggestions,
      balancedEquation
    };
  }

  private checkBalance(reactants: string[], products: string[]): boolean {
    // Simplified balance checking
    // In a real implementation, this would parse chemical formulas
    // and count atoms of each element
    
    const reactantAtoms = this.countAtoms(reactants);
    const productAtoms = this.countAtoms(products);
    
    for (const [element, count] of reactantAtoms) {
      if (productAtoms.get(element) !== count) {
        return false;
      }
    }
    
    return true;
  }

  private countAtoms(compounds: string[]): Map<string, number> {
    const atomCount = new Map<string, number>();
    
    // Simplified atom counting
    compounds.forEach(compound => {
      // This is a very basic implementation
      // Real implementation would parse chemical formulas properly
      if (compound.includes('H')) atomCount.set('H', (atomCount.get('H') || 0) + 1);
      if (compound.includes('O')) atomCount.set('O', (atomCount.get('O') || 0) + 1);
      if (compound.includes('C')) atomCount.set('C', (atomCount.get('C') || 0) + 1);
      if (compound.includes('Na')) atomCount.set('Na', (atomCount.get('Na') || 0) + 1);
      if (compound.includes('Cl')) atomCount.set('Cl', (atomCount.get('Cl') || 0) + 1);
    });
    
    return atomCount;
  }

  private validateFormulas(formulas: string[]): string[] {
    const invalid: string[] = [];
    const validPattern = /^[A-Z][a-z]?(\d+)?(\([A-Z][a-z]?\d*\)\d*)*$/;
    
    formulas.forEach(formula => {
      if (!validPattern.test(formula)) {
        invalid.push(formula);
      }
    });
    
    return invalid;
  }

  private attemptBalance(equation: string): string {
    // Simplified balancing attempt
    // Real implementation would use matrix methods or trial-and-error algorithms
    return `Balanced: ${equation} (balancing algorithm not implemented)`;
  }

  async assessReactionSafety(reaction: any): Promise<SafetyAssessment> {
    const allSubstances = [...reaction.reactants, ...reaction.products];
    let maxHazardLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    const warnings: string[] = [];
    const precautions: string[] = [];
    const emergencyProcedures: string[] = [];
    const incompatibleSubstances: string[] = [];

    allSubstances.forEach(substance => {
      const safety = this.safetyDatabase.get(substance);
      if (safety) {
        if (safety.hazard === 'extreme') maxHazardLevel = 'extreme';
        else if (safety.hazard === 'high' && maxHazardLevel !== 'extreme') maxHazardLevel = 'high';
        else if (safety.hazard === 'medium' && !['high', 'extreme'].includes(maxHazardLevel)) maxHazardLevel = 'medium';
        
        warnings.push(...safety.warnings);
      }
    });

    // Add general precautions based on hazard level
    switch (maxHazardLevel) {
      case 'extreme':
        precautions.push('Use full protective equipment', 'Work in fume hood', 'Have emergency shower nearby');
        emergencyProcedures.push('Evacuate area immediately', 'Call emergency services');
        break;
      case 'high':
        precautions.push('Wear safety goggles and gloves', 'Ensure good ventilation');
        emergencyProcedures.push('Remove from exposure', 'Seek medical attention');
        break;
      case 'medium':
        precautions.push('Wear basic protective equipment', 'Work in well-ventilated area');
        emergencyProcedures.push('Follow standard first aid procedures');
        break;
      default:
        precautions.push('Follow standard laboratory safety procedures');
        emergencyProcedures.push('Standard emergency procedures apply');
    }

    return {
      hazardLevel: maxHazardLevel,
      warnings: [...new Set(warnings)], // Remove duplicates
      precautions,
      emergencyProcedures,
      incompatibleSubstances
    };
  }
}

export const reactionService = new ReactionService();