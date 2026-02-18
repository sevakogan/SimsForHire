export interface CarrierOption {
  value: string;
  label: string;
}

export const CARRIER_OPTIONS: CarrierOption[] = [
  { value: "UPS", label: "UPS" },
  { value: "FedEx", label: "FedEx" },
  { value: "Amazon", label: "Amazon" },
  { value: "USPS", label: "USPS" },
  { value: "Other", label: "Other" },
];
