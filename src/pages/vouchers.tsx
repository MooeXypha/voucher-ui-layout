import { CONFIG } from 'src/config-global';

import { VoucherView } from 'src/sections/voucher/view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <title>{`Vouchers - ${CONFIG.appName}`}</title>

      <VoucherView />
    </>
  );
}
