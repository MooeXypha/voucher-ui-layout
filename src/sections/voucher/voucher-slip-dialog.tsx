import { jsPDF } from 'jspdf';
import { useRef } from 'react';
import html2canvas from 'html2canvas';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import masterLogo from 'src/components/logo/master.jpg';

import type { VoucherProps } from './voucher-table-row';

type VoucherSlipDialogProps = {
  open: boolean;
  onClose: () => void;
  voucher: VoucherProps | null;
};

const BRAND = {
  name: 'Pig & Bear (Official Account)',
  address:
    'Tiktok Account ရောင်းဝယ်ခြင်း/ Account Service လုပ်ဆောင်ပေးခြင်း /ဘဏ်ချိတ်Service လုပ်ဆောင်ပေးခြင်း / Account Boosting Service လုပ်ဆောင်ပေးခြင်း',
};

const THANK_YOU_LINE =
  'Thank you for choosing our service! Please contact Telegram link @aliceMooe25 if you have any questions or need assistance';

export function VoucherSlipDialog({ open, onClose, voucher }: VoucherSlipDialogProps) {
  const slipRef = useRef<HTMLDivElement | null>(null);

  if (!voucher) return null;

  const safeVoucherId = getSafeVoucherId(voucher.id);
  const amountPaid = formatMmk(voucher.amountPaid);

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
      const fileName = `voucher-${sanitizeFileName(safeVoucherId)}.pdf`;
      const { pdf, blob } = await generateSlipPdf(slipRef.current, safeVoucherId);

      if (isMobileDevice()) {
        const handled = await trySharePdf(blob, fileName);
        if (!handled) {
          openPdfBlob(blob);
        }
        return;
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Failed to download voucher PDF:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>Voucher Slip Detail</DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box
          ref={slipRef}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 2,
            border: '1px solid #efb090',
            boxShadow: '0 8px 24px rgba(146, 72, 35, 0.15)',
            background: '#fffaf7',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -48,
              left: -48,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234, 169, 134, 0.45) 0%, rgba(234, 169, 134, 0) 72%)',
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              right: -42,
              bottom: -36,
              width: 130,
              height: 130,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(234, 169, 134, 0.4) 0%, rgba(234, 169, 134, 0) 72%)',
              pointerEvents: 'none',
            }}
          />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5, pb: 1.25, borderBottom: '1px solid #edc2a9' }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: { xs: 84, sm: 100 },
                  height: { xs: 84, sm: 100 },
                  p: 0.5,
                  borderRadius: '50%',
                  border: '1px solid #e2b191',
                  bgcolor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <Box
                  component="img"
                  src={masterLogo}
                  alt="Master logo"
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ color: '#8b4519', lineHeight: 1.1, fontWeight: 800 }}>
                  {BRAND.name}
                </Typography>
                <Typography variant="body2" sx={{ color: '#7a5032', mt: 0.25 }}>
                  {BRAND.address}
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1} sx={{ width: { xs: '100%', sm: 220 }, flexShrink: 0 }}>
              <Box sx={{ border: '1px solid #e8b89a', minHeight: 46, px: 1.25, py: 0.75 }}>
                <Typography variant="body2" sx={{ color: '#7a3f1f', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  No.: {safeVoucherId}
                </Typography>
              </Box>

              <Box sx={{ border: '1px solid #e8b89a', minHeight: 46, px: 1.25, py: 0.75 }}>
                <Typography variant="body2" sx={{ color: '#7a3f1f', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Date: {voucher.paymentDate || '-'}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Stack spacing={1.25} sx={{ mb: 2.25 }}>
            <VoucherLine label="Received From" value={`${voucher.buyerName} (${voucher.buyerPhoneNumber})`} />
            <VoucherLine label="Amount" value={amountPaid} />
            <VoucherLine
              label="For"
              value={`${voucher.serviceType} / ${voucher.accountCategory} / ${voucher.remark || 'Voucher service'}`}
            />
            <VoucherLine label="Received by" value={voucher.accountUserName} />
            <Typography variant="body2" sx={{ mt: 1.5, color: '#7a5032', lineHeight: 1.5 }}>
              {THANK_YOU_LINE}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box sx={{ width: { xs: '100%', sm: 320 }, border: '1px solid #e8b89a', bgcolor: '#fff' }}>
              <BalanceRow label="Amount of Balance" value={amountPaid} />
              <BalanceRow label="Payment Amount" value={amountPaid} />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: 240 } }}>
              <Typography variant="body2" sx={{ color: '#7a3f1f', fontWeight: 700, mb: 0.75 }}>
                Payment Method :
              </Typography>
              <Stack spacing={0.5} sx={{ mb: 1 }}>
                <PaymentOption
                  label="K Pay"
                  checked={isMethodSelected(voucher.paymentMethod, 'k pay')}
                />
                <PaymentOption
                  label="Wave Pay"
                  checked={isMethodSelected(voucher.paymentMethod, 'wave pay')}
                />
                <PaymentOption
                  label="Thai Bhat"
                  checked={isMethodSelected(voucher.paymentMethod, 'thai bhat')}
                />
                <PaymentOption label="Cash" checked={isMethodSelected(voucher.paymentMethod, 'cash')} />
              </Stack>
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

function VoucherLine({ label, value }: SlipFieldProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minHeight: 28 }}>
      <Typography variant="body2" sx={{ width: 112, color: '#7a3f1f', fontWeight: 700, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#7a3f1f', fontWeight: 700, flexShrink: 0 }}>
        :
      </Typography>
      <Typography
        variant="body2"
        sx={{
          flexGrow: 1,
          color: '#5e3b27',
          borderBottom: '1px dotted #e4b799',
          pb: 0.25,
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}
      >
        {value || '-'}
      </Typography>
    </Stack>
  );
}

type BalanceRowProps = {
  label: string;
  value: string;
};

function BalanceRow({ label, value }: BalanceRowProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        minHeight: 34,
        borderBottom: '1px solid #e8b89a',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          px: 1,
          py: 0.75,
          width: '55%',
          color: '#7a3f1f',
          fontWeight: 700,
          borderRight: '1px solid #e8b89a',
        }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ px: 1, py: 0.75, width: '45%', color: '#5e3b27', fontWeight: 700 }}>
        {value}
      </Typography>
    </Stack>
  );
}

type PaymentOptionProps = {
  label: string;
  checked: boolean;
};

function PaymentOption({ label, checked }: PaymentOptionProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box
        sx={{
          width: 16,
          height: 16,
          border: '1px solid #d7a586',
          bgcolor: checked ? '#e6a67f' : '#fff',
          color: '#fff',
          fontSize: 11,
          lineHeight: '14px',
          textAlign: 'center',
          fontWeight: 800,
        }}
      >
        {checked ? 'x' : ''}
      </Box>
      <Typography variant="body2" sx={{ color: '#5e3b27' }}>
        {label}
      </Typography>
    </Stack>
  );
}

function isMethodSelected(method: string, option: string) {
  const normalizedMethod = String(method || '').toLowerCase();
  const normalizedOption = String(option || '').toLowerCase();
  return normalizedMethod.includes(normalizedOption);
}

async function generateSlipPdf(target: HTMLDivElement | null, safeVoucherId: string) {
  if (!target) {
    throw new Error('Voucher slip content is not ready yet.');
  }

  // Force a desktop-sized render context so PDF keeps the same layout on mobile.
  const PDF_RENDER_WIDTH = 1280;
  const PDF_RENDER_HEIGHT = 900;

  const canvas = await html2canvas(target, {
    backgroundColor: '#fffaf7',
    scale: 2,
    useCORS: true,
    windowWidth: PDF_RENDER_WIDTH,
    windowHeight: PDF_RENDER_HEIGHT,
    scrollX: 0,
    scrollY: 0,
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
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

function formatMmk(value: number): string {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('en-US')} MMK`;
}

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function trySharePdf(blob: Blob, fileName: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;

  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return true;
    }
  } catch (error) {
    console.warn('Native share failed, falling back to open PDF.', error);
  }

  return false;
}

function openPdfBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000);
}
