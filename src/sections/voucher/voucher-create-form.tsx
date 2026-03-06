import { useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Grid,
} from '@mui/material';

import { VoucherProps } from './voucher-table-row';

type VoucherCreateFormProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (voucher: Omit<VoucherProps, 'id'>) => void;
};

const serviceTypes = ['Account Sell', 'Account Service', 'Account Bank Service', 'Account Boosting'];
const accountCategories = ['Over 15k', 'Under 15k'];
const paymentMethods = ['K Pay', 'Wave Pay', 'Thai Bhat', 'Cash'];

export function VoucherCreateForm({ open, onClose, onCreate }: VoucherCreateFormProps) {
  const [formData, setFormData] = useState({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.buyerName.trim()) newErrors.buyerName = 'Buyer name is required';
    if (formData.buyerName.length > 100) newErrors.buyerName = 'Buyer name too long';

    const phoneRegex = /^(09|\+959)\d{7,9}$/;
    if (!formData.buyerPhoneNumber.trim()) newErrors.buyerPhoneNumber = 'Phone number is required';
    else if (!phoneRegex.test(formData.buyerPhoneNumber)) newErrors.buyerPhoneNumber = 'Invalid phone format';

    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.accountCategory) newErrors.accountCategory = 'Account category is required';
    if (!formData.accountUserName.trim()) newErrors.accountUserName = 'Account username is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    const amount = parseInt(formData.amountPaid, 10);
    if (isNaN(amount) || amount < 0) newErrors.amountPaid = 'Amount must be a positive number';

    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';

    if (formData.remark && formData.remark.length > 500) newErrors.remark = 'Remark too long';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const voucher: Omit<VoucherProps, 'id'> = {
      buyerName: formData.buyerName,
      buyerPhoneNumber: formData.buyerPhoneNumber,
      serviceType: formData.serviceType,
      accountCategory: formData.accountCategory,
      accountUserName: formData.accountUserName,
      amountPaid: parseInt(formData.amountPaid, 10),
      prepaid: formData.prepaid,
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
      ...(formData.remark && { remark: formData.remark }),
    };

    onCreate(voucher);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
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
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Voucher</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Buyer Name"
              value={formData.buyerName}
              onChange={(e) => handleChange('buyerName', e.target.value)}
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
              onChange={(e) => handleChange('buyerPhoneNumber', e.target.value)}
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
              onChange={(e) => handleChange('serviceType', e.target.value)}
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
              onChange={(e) => handleChange('accountCategory', e.target.value)}
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
              onChange={(e) => handleChange('accountUserName', e.target.value)}
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
              onChange={(e) => handleChange('amountPaid', e.target.value)}
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
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
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
              onChange={(e) => handleChange('paymentDate', e.target.value)}
              error={!!errors.paymentDate}
              helperText={errors.paymentDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid size={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.prepaid}
                  onChange={(e) => handleChange('prepaid', e.target.checked)}
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
              onChange={(e) => handleChange('remark', e.target.value)}
              error={!!errors.remark}
              helperText={errors.remark}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
