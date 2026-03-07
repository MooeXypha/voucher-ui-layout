import { jsPDF } from 'jspdf';
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
  if (!voucher) return null;

  const safeVoucherId = getSafeVoucherId(voucher.id);

  const handlePreviewPdf = async () => {
    const { blob } = await generateSlipPdf(voucher, safeVoucherId);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  };

  const handleDownloadPdf = async () => {
    const { pdf } = await generateSlipPdf(voucher, safeVoucherId);
    pdf.save(`voucher-${sanitizeFileName(safeVoucherId)}.pdf`);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>Voucher Slip Detail</DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Box
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
                  minWidth: { xs: 230, sm: 260 },
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
              <SlipField label="Amount Paid" value={fCurrency(voucher.amountPaid)} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <SlipField label="Remark" value={voucher.remark || '-'} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, borderColor: 'rgba(173, 20, 87, 0.2)' }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
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
              }}
            >
              <Typography variant="h5" sx={{ color: '#880e4f' }}>
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

const A5_WIDTH_MM = 148;
const A5_HEIGHT_MM = 210;
// A5 at ~96 DPI (portrait)
const A5_WIDTH_PX = 559;
const A5_HEIGHT_PX = Math.round((A5_WIDTH_PX * A5_HEIGHT_MM) / A5_WIDTH_MM);

async function generateSlipPdf(voucher: VoucherProps, safeVoucherId: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = `${A5_WIDTH_PX}px`;
  container.style.height = `${A5_HEIGHT_PX}px`;
  container.style.background = '#fff';
  container.innerHTML = buildSlipPrintHtml(voucher, safeVoucherId);
  document.body.appendChild(container);

  const canvas = await html2canvas(container, {
    backgroundColor: '#fff7fb',
    scale: 2,
    useCORS: true,
    width: A5_WIDTH_PX,
    height: A5_HEIGHT_PX,
    windowWidth: A5_WIDTH_PX,
    windowHeight: A5_HEIGHT_PX,
  });

  document.body.removeChild(container);

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

  pdf.addImage(imageData, 'PNG', 0, 0, A5_WIDTH_MM, A5_HEIGHT_MM);
  const blob = pdf.output('blob');

  return { pdf, blob };
}

function buildSlipPrintHtml(voucher: VoucherProps, voucherId: string): string {
  const amountPaid = fCurrency(voucher.amountPaid);

  return `<style>
      * { box-sizing: border-box; }
      .print-root {
        margin: 0;
        padding: 18px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: #fff7fb;
        color: #4a1450;
        width: ${A5_WIDTH_PX}px;
        height: ${A5_HEIGHT_PX}px;
      }
      .sheet {
        width: 100%;
        height: 100%;
        margin: 0 auto;
        border: 1px solid #f8bbd0;
        border-radius: 16px;
        overflow: hidden;
        background: linear-gradient(180deg, #fff7fb 0%, #ffe4f0 45%, #ffd7e8 100%);
      }
      .header {
        padding: 16px;
        text-align: center;
        color: #fff;
        background: linear-gradient(135deg, #ec407a 0%, #d81b60 60%, #ad1457 100%);
      }
      .logo-wrap {
        display: inline-block;
        padding: 10px 14px;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.28);
        background: rgba(255, 255, 255, 0.16);
      }
      .logo {
        width: 160px;
        height: 56px;
        object-fit: contain;
        display: block;
      }
      .brand-title {
        margin: 10px 0 3px;
        font-size: 20px;
        font-weight: 700;
      }
      .brand-desc {
        margin: 0 auto;
        max-width: 560px;
        color: rgba(255, 255, 255, 0.9);
        font-size: 12px;
        line-height: 1.45;
      }
      .voucher-id {
        display: inline-block;
        margin-top: 10px;
        padding: 8px 12px;
        min-width: 220px;
        border-radius: 14px;
        background: #fff;
        color: #880e4f;
        box-shadow: 0 8px 18px rgba(122, 7, 62, 0.25);
      }
      .voucher-id-label {
        text-transform: uppercase;
        letter-spacing: 0.8px;
        font-size: 11px;
        font-weight: 700;
        color: #ad1457;
      }
      .voucher-id-value {
        margin-top: 4px;
        font-family: monospace;
        letter-spacing: 0.5px;
        font-size: 14px;
        font-weight: 800;
        word-break: break-all;
      }
      .content {
        padding: 16px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .field {
        border: 1px dashed #f48fb1;
        background: rgba(255, 255, 255, 0.72);
        border-radius: 10px;
        min-height: 64px;
        padding: 10px;
      }
      .field.full {
        grid-column: 1 / -1;
      }
      .label {
        color: #ad1457;
        font-size: 12px;
        font-weight: 700;
      }
      .value {
        margin-top: 4px;
        color: #4a1450;
        font-size: 14px;
        word-break: break-word;
      }
      .summary {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(173, 20, 87, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .summary-amount {
        padding: 7px 10px;
        border-radius: 10px;
        border: 1px solid #f48fb1;
        background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%);
        color: #880e4f;
        font-size: 22px;
        font-weight: 700;
      }
    </style>
    <main class="print-root">
      <section class="sheet">
      <section class="header">
        <div class="logo-wrap">
          <img class="logo" src="${masterLogo}" alt="Master logo" />
        </div>
        <h1 class="brand-title">${escapeHtml(BRAND.name)}</h1>
        <p class="brand-desc">${escapeHtml(BRAND.description)}</p>
        <div class="voucher-id">
          <div class="voucher-id-label">Voucher ID</div>
          <div class="voucher-id-value">${escapeHtml(voucherId)}</div>
        </div>
      </section>

      <section class="content">
        <div class="grid">
          ${renderField('Buyer Name', voucher.buyerName)}
          ${renderField('Buyer Phone', voucher.buyerPhoneNumber)}
          ${renderField('Service Type', voucher.serviceType)}
          ${renderField('Account Category', voucher.accountCategory)}
          ${renderField('Account Username', voucher.accountUserName)}
          ${renderField('Payment Method', voucher.paymentMethod)}
          ${renderField('Payment Date', voucher.paymentDate)}
          ${renderField('Voucher ID', voucherId)}
          ${renderField('Amount Paid', amountPaid)}
          ${renderField('Remark', voucher.remark || '-', true)}
        </div>

        <div class="summary">
          <div>Payment Summary</div>
          <div class="summary-amount">${escapeHtml(amountPaid)}</div>
        </div>
      </section>
      </section>
    </main>`;
}

function renderField(label: string, value: string, full = false): string {
  return `<div class="field${full ? ' full' : ''}"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
