import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes, isHexString } from 'ethers';

export interface ContractVerificationResult {
  isValid: boolean;
  issuedAt: number; // Unix timestamp in seconds
  dataHash: string;
  onChain: boolean;
  contractAddress?: string;
  error?: string;
}

const LOGIC_ABI = [
  'function verifyCertificate(bytes32 certId) view returns (bool isValid, uint256 issuedAt, bytes32 dataHash)',
];

export const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';
export const VERIFIER_CONTRACT_ADDRESS = import.meta.env.VITE_VERIFIER_CONTRACT_ADDRESS || '';

function toBytes32(certId: string): string {
  const trimmed = certId.trim();
  if (isHexString(trimmed, 32)) {
    return trimmed;
  }
  return keccak256(toUtf8Bytes(trimmed));
}

export async function verifyCertificateOnChain(certId: string): Promise<ContractVerificationResult> {
  const formattedCertId = certId.trim().toUpperCase();

  // If contract address is configured, attempt real on-chain query
  if (VERIFIER_CONTRACT_ADDRESS) {
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(VERIFIER_CONTRACT_ADDRESS, LOGIC_ABI, provider);
      const certBytes32 = toBytes32(formattedCertId);

      const [isValid, issuedAtBigInt, dataHash] = await contract.verifyCertificate(certBytes32);

      return {
        isValid: Boolean(isValid),
        issuedAt: Number(issuedAtBigInt),
        dataHash: String(dataHash),
        onChain: true,
        contractAddress: VERIFIER_CONTRACT_ADDRESS,
      };
    } catch (err: any) {
      console.warn('On-chain verification query failed, using simulated fallback:', err?.message);
    }
  }

  // Fallback simulation when contract address is omitted or node is offline
  // Simulated rules matching SDD / Demo specs:
  if (formattedCertId.startsWith('NSP-T') || formattedCertId.startsWith('NSP-R') || formattedCertId.startsWith('NSP-X')) {
    return {
      isValid: false,
      issuedAt: Math.floor(Date.now() / 1000) - 86400 * 45,
      dataHash: '0x' + '0'.repeat(64),
      onChain: false,
    };
  }

  // Default valid mock record
  return {
    isValid: true,
    issuedAt: Math.floor(Date.now() / 1000) - 86400 * 30, // 30 days ago
    dataHash: '0x3a7fc1829e64bb721389c9c104278df782a1bc21034f19bc019a84218de8c84d',
    onChain: false,
  };
}
