declare module 'snarkjs' {
  export namespace groth16 {
    export function fullProve(
      input: any,
      wasmPath: string,
      zkeyPath: string
    ): Promise<{
      proof: any;
      publicSignals: any[];
    }>;

    export function verify(
      verificationKey: any,
      publicSignals: any[],
      proof: any
    ): Promise<boolean>;

    export function setup(
      r1csPath: string,
      ptauPath: string,
      zkeyPath: string
    ): Promise<void>;
  }

  export namespace powersOfTau {
    export function newAccumulator(
      curve: string,
      power: number,
      outputPath: string
    ): Promise<void>;

    export function contribute(
      inputPath: string,
      outputPath: string,
      name: string,
      entropy?: string
    ): Promise<void>;

    export function preparePhase2(
      inputPath: string,
      outputPath: string
    ): Promise<void>;
  }

  export namespace zKey {
    export function newZKey(
      r1csPath: string,
      ptauPath: string,
      zkeyPath: string
    ): Promise<void>;

    export function contribute(
      inputPath: string,
      outputPath: string,
      name: string,
      entropy?: string
    ): Promise<void>;

    export function exportVerificationKey(
      zkeyPath: string
    ): Promise<any>;
  }
}
