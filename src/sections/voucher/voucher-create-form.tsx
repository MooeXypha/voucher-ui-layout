import { useState, useEffect } from 'react';

import {
  Grid,
  Dialog,
  Button,
  Checkbox,
  MenuItem,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import type { VoucherProps } from './voucher-table-row';

type VoucherCreateFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (voucher: Omit<VoucherProps, 'id'>) => void;
  initialData?: VoucherProps | null;
  title?: string;
  submitButtonText?: string;
};

const serviceTypes = ['Account Sell', 'Account Service', 'Account Bank Service', 'Account Boosting'];
const accountCategories = ['Over 15k', 'Under 15k', 'Other Service'];
const paymentMethods = ['K Pay', 'Wave Pay', 'Thai Bhat', 'Cash'];

const normalizePhoneNumber = (value: string) =>
  value
    // Myanmar digits
    .replace(/[\u1040-\u1049]/g, (digit) => String(digit.charCodeAt(0) - 0x1040))
    // Full-width digits
    .replace(/[\uFF10-\uFF19]/g, (digit) => String(digit.charCodeAt(0) - 0xff10))
    // Convert international prefix 00 to +
    .replace(/^\s*00/, '+')
    // Remove common separators used in global phone formats
    .replace(/[\s().-]/g, '')
    .trim();

const isValidPhoneNumber = (value: string) => {
  // Keep client-side validation permissive for global regions; backend handles final validation.
  if (value.startsWith('+')) return /^\+\d{6,20}$/.test(value);
  return /^\d{6,20}$/.test(value);
};

const formatDateInput = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const toDateInputValue = (value: string) => {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const datePart = value.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return formatDateInput(parsed);
};

const emptyFormData = {
  buyerName: '',
  buyerPhoneNumber: '',
  serviceType: '',
  accountCategory: '',
  accountUserName: '',
  amountPaid: '',
  prepaid: false,
  paymentMethod: '',
  paymentDate: '',
  remark: '',
};

export function VoucherCreateForm({
  open,
  onClose,
  onSubmit,
  initialData = null,
  title = 'Create New Voucher',
  submitButtonText = 'Create',
}: VoucherCreateFormProps) {
  const [formData, setFormData] = useState({
    ...emptyFormData,
  });
  useEffect(() => {
    if (!open) return;

    if (initialData) {
      setFormData({
        buyerName: initialData.buyerName,
        buyerPhoneNumber: initialData.buyerPhoneNumber,
        serviceType: initialData.serviceType,
        accountCategory: initialData.accountCategory,
        accountUserName: initialData.accountUserName,
        amountPaid: String(initialData.amountPaid),
        prepaid: initialData.prepaid,
        paymentMethod: initialData.paymentMethod,
        paymentDate: toDateInputValue(initialData.paymentDate),
        remark: initialData.remark || '',
      });
    } else {
      setFormData({ ...emptyFormData });
    }

    setErrors({});
  }, [initialData, open]);


  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const normalizedPhone = normalizePhoneNumber(formData.buyerPhoneNumber);

    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer name is required';
    if (formData.buyerName.length > 100) newErrors.buyerName = 'Buyer name too long';

    if (!normalizedPhone) newErrors.buyerPhoneNumber = 'Phone number is required';
    else if (!isValidPhoneNumber(normalizedPhone)) {
      newErrors.buyerPhoneNumber = 'Invalid phone format. Use a valid local or international number';
    }

    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.accountCategory) newErrors.accountCategory = 'Account category is required';
    if (!formData.accountUserName.trim()) newErrors.accountUserName = 'Account username is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    const amount = parseInt(formData.amountPaid, 10);
    if (isNaN(amount) || amount < 0) newErrors.amountPaid = 'Amount must be a positive number';

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    } else {
      const selectedDate = new Date(`${formData.paymentDate}T00:00:00`);
      if (Number.isNaN(selectedDate.getTime())) {
        newErrors.paymentDate = 'Invalid payment date';
      } else if (!initialData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate.getTime() < today.getTime()) {
          newErrors.paymentDate = 'Payment date cannot be in the past';
        }
      }
    }

    if (formData.remark && formData.remark.length > 500) newErrors.remark = 'Remark too long';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const normalizedPhone = normalizePhoneNumber(formData.buyerPhoneNumber);

    const voucher: Omit<VoucherProps, 'id'> = {
      buyerName: formData.buyerName,
      buyerPhoneNumber: normalizedPhone,
      serviceType: formData.serviceType,
      accountCategory: formData.accountCategory,
      accountUserName: formData.accountUserName,
      amountPaid: parseInt(formData.amountPaid, 10),
      prepaid: formData.prepaid,
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      ...(formData.remark && { remark: formData.remark }),
    };

    onSubmit(voucher);
    handleClose();
  };

  const handleClose = () => {
    setFormData({ ...emptyFormData });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Buyer Name"
              value={formData.buyerName}
              onChange={(e: { target: { value: any; }; }) => handleChange('buyerName', e.target.value)}
              error={!!errors.buyerName}
              helperText={errors.buyerName}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Buyer Phone Number"
              value={formData.buyerPhoneNumber}
              onChange={(e: { target: { value: any; }; }) => handleChange('buyerPhoneNumber', e.target.value)}
              error={!!errors.buyerPhoneNumber}
              helperText={errors.buyerPhoneNumber}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Service Type"
              value={formData.serviceType}
              onChange={(e: { target: { value: any; }; }) => handleChange('serviceType', e.target.value)}
              error={!!errors.serviceType}
              helperText={errors.serviceType}
              required
            >
              {serviceTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Account Category"
              value={formData.accountCategory}
              onChange={(e: { target: { value: any; }; }) => handleChange('accountCategory', e.target.value)}
              error={!!errors.accountCategory}
              helperText={errors.accountCategory}
              required
            >
              {accountCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Account Username"
              value={formData.accountUserName}
              onChange={(e: { target: { value: any; }; }) => handleChange('accountUserName', e.target.value)}
              error={!!errors.accountUserName}
              helperText={errors.accountUserName}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Amount Paid"
              type="number"
              value={formData.amountPaid}
              onChange={(e: { target: { value: any; }; }) => handleChange('amountPaid', e.target.value)}
              error={!!errors.amountPaid}
              helperText={errors.amountPaid}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              label="Payment Method"
              value={formData.paymentMethod}
              onChange={(e: { target: { value: any; }; }) => handleChange('paymentMethod', e.target.value)}
              error={!!errors.paymentMethod}
              helperText={errors.paymentMethod}
              required
            >
              {paymentMethods.map((method) => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              value={formData.paymentDate}
              onChange={(e: { target: { value: any; }; }) => handleChange('paymentDate', e.target.value)}
              error={!!errors.paymentDate}
              helperText={errors.paymentDate}
              inputProps={!initialData ? { min: formatDateInput(new Date()) } : undefined}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid size={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.prepaid}
                  onChange={(e: { target: { checked: any; }; }) => handleChange('prepaid', e.target.checked)}
                />
              }
              label="Prepaid"
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Remark (Optional)"
              multiline
              rows={3}
              value={formData.remark}
              onChange={(e: { target: { value: any; }; }) => handleChange('remark', e.target.value)}
              error={!!errors.remark}
              helperText={errors.remark}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
