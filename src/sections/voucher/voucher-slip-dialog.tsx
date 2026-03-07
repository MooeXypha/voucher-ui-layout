import { jsPDF } from 'jspdf';
import { useRef } from 'react';
import html2canvas from 'html2canvas';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrency } from 'src/utils/format-number';

import masterLogo from 'src/components/logo/master.jpg';

import type { VoucherProps } from './voucher-table-row';

type VoucherSlipDialogProps = {
  open: boolean;
  onClose: () => void;
  voucher: VoucherProps | null;
};

const BRAND = {
  name: 'Pig & Bear (Official Account)',
  description: 'Tiktok Account အရောင်းအဝယ် / Account ပိုင်းဆိုင်ရာ Service နှင့် Boosting လုပ်ခြင်း Service များကို အာမခံ အပြည့်နှင့် ဆောင်ရွက်ပေးပါသည်။',
};

export function VoucherSlipDialog({ open, onClose, voucher }: VoucherSlipDialogProps) {
  const slipRef = useRef<HTMLDivElement | null>(null);

  if (!voucher) return null;

  const safeVoucherId = getSafeVoucherId(voucher.id);
  const handlePreviewPdf = async () => {
    try {
      const { blob } = await generateSlipPdf(slipRef.current, safeVoucherId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60000);
    } catch (error) {
      console.error('Failed to preview voucher PDF:', error);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { pdf } = await generateSlipPdf(slipRef.current, safeVoucherId);
      pdf.save(`voucher-${sanitizeFileName(safeVoucherId)}.pdf`);
    } catch (error) {
      console.error('Failed to download voucher PDF:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>Voucher Slip Detail</DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box
          ref={slipRef}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: '#f8bbd0',
            boxShadow: '0 16px 32px rgba(173, 20, 87, 0.12)',
            background:
              'linear-gradient(180deg, #fff7fb 0%, #ffe4f0 45%, #ffd7e8 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -34,
              right: -34,
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(244, 143, 177, 0.55) 0%, rgba(244, 143, 177, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              p: 2.25,
              mb: 2,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #ec407a 0%, #d81b60 60%, #ad1457 100%)',
              color: '#fff',
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              textAlign="center"
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.75,
                  bgcolor: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.28)',
                }}
              >
                <Box
                  component="img"
                  src={masterLogo}
                  alt="Master logo"
                  sx={{
                    width: { xs: 150, sm: 190 },
                    height: { xs: 52, sm: 66 },
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </Box>

              <Box>
                <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.2 }}>
                  {BRAND.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)', mt: 0.25, maxWidth: 360, mx: 'auto' }}
                >
                  {BRAND.description}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 2,
                  py: 1.25,
                  borderRadius: 1.75,
                  bgcolor: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: 320,
                  boxShadow: '0 8px 18px rgba(122, 7, 62, 0.25)',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#ad1457', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}
                >
                  Voucher ID
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 0.25,
                    fontWeight: 800,
                    color: '#880e4f',
                    letterSpacing: 0.5,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  {safeVoucherId}
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#880e4f', letterSpacing: 0.3 }}>
                Customer Payment Details
              </Typography>
              <Typography variant="body2" sx={{ color: '#6a1b4d' }}>
                Service အပ်နှံခြင်းနှင့် ဝယ်ယူအားပေးခြင်းများအတွက် ကျေးဇူးတင်ပါသည်။ တစုံတခု အဆင်မပြေဖြစ်ပါက ကျွန်ုပ်တို့၏ Support Team Telegram &quot;@alicemooe&quot; သို့ ဆက်သွယ်ရန် မမေ့ပါနှင့်။ Voucher slip ရှိနေမှသာ အာမခံအပြည့် ရရှိမည်ဖြစ်သည်။
              </Typography>
            </Box>
            <Chip
              label={voucher.prepaid ? 'Prepaid' : 'Not Prepaid'}
              color={voucher.prepaid ? 'secondary' : 'default'}
              variant={voucher.prepaid ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <Divider sx={{ my: 2, borderColor: 'rgba(173, 20, 87, 0.2)' }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Buyer Name" value={voucher.buyerName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Buyer Phone" value={voucher.buyerPhoneNumber} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Service Type" value={voucher.serviceType} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Account Category" value={voucher.accountCategory} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Account Username" value={voucher.accountUserName} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Payment Method" value={voucher.paymentMethod} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Payment Date" value={voucher.paymentDate} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Voucher ID" value={safeVoucherId} />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <SlipField label="Amount Paid" value={fCurrency(voucher.amountPaid)} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <SlipField label="Remark" value={voucher.remark || '-'} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, borderColor: 'rgba(173, 20, 87, 0.2)' }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.25}
          >
            <Typography variant="body2" sx={{ color: '#6a1b4d' }}>
              Payment Summary
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
                border: '1px solid #f48fb1',
                maxWidth: '100%',
                alignSelf: { xs: 'flex-end', sm: 'auto' },
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: '#880e4f', wordBreak: 'break-word', textAlign: 'right' }}
              >
                {fCurrency(voucher.amountPaid)}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 0 }}>
        <Button variant="outlined" color="secondary" onClick={handlePreviewPdf}>
          Preview PDF
        </Button>
        <Button variant="contained" color="secondary" onClick={handleDownloadPdf}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type SlipFieldProps = {
  label: string;
  value: string;
};

function SlipField({ label, value }: SlipFieldProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        border: '1px dashed',
        borderColor: '#f48fb1',
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        minHeight: 72,
      }}
    >
      <Typography variant="caption" sx={{ color: '#ad1457', display: 'block', fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ mt: 0.75, color: '#4a1450', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}

async function generateSlipPdf(target: HTMLDivElement | null, safeVoucherId: string) {
  if (!target) {
    throw new Error('Voucher slip content is not ready yet.');
  }

  const canvas = await html2canvas(target, {
    backgroundColor: '#fff7fb',
    scale: 2,
    useCORS: true,
    windowWidth: document.documentElement.clientWidth,
    windowHeight: document.documentElement.clientHeight,
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
    compress: true,
  });

  pdf.setProperties({
    title: `Voucher Slip ${safeVoucherId}`,
    subject: 'Voucher Slip (A5)',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Fit captured slip into A5 page while preserving aspect ratio.
  let renderWidth = pageWidth;
  let renderHeight = (canvas.height * renderWidth) / canvas.width;

  if (renderHeight > pageHeight) {
    renderHeight = pageHeight;
    renderWidth = (canvas.width * renderHeight) / canvas.height;
  }

  const x = (pageWidth - renderWidth) / 2;
  const y = (pageHeight - renderHeight) / 2;

  pdf.addImage(imageData, 'PNG', x, y, renderWidth, renderHeight);
  const blob = pdf.output('blob');

  return { pdf, blob };
}

function getSafeVoucherId(input: string): string {
  const value = String(input || '').trim();
  if (!value) return 'N/A';

  const normalized = value.toLowerCase();
  if (normalized === 'undefined' || normalized === 'null' || normalized === 'nan') {
    return 'N/A';
  }

  return value;
}

function sanitizeFileName(input: string): string {
  return input.replace(/[^a-zA-Z0-9-_]/g, '_');
}
