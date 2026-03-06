// This file mirrors the server-side DTO used for voucher creation.
// You may use it for type hints in forms or API interactions.

export interface CreateVoucherDto {
  buyerName: string;
  buyerPhoneNumber: string;
  serviceType: string;
  accountCategory: string;
  accountUserName: string;
  amountPaid: number;
  prepaid: boolean;
  paymentMethod: string;
  paymentDate: string; // ISO string
  remark?: string;
}
