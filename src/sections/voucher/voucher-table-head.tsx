import Box from '@mui/material/Box';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableSortLabel from '@mui/material/TableSortLabel';

import { visuallyHidden } from './utils';

import type { VoucherProps } from './voucher-table-row.tsx';

export type VoucherHeadLabel = {
  id: keyof VoucherProps | '';
  label: string;
  align?: 'right' | 'left' | 'center';
};

const headLabel: VoucherHeadLabel[] = [
  { id: 'id', label: 'Voucher ID' },
  { id: 'buyerName', label: 'Buyer' },
  { id: 'buyerPhoneNumber', label: 'Phone' },
  { id: 'serviceType', label: 'Service' },
  { id: 'accountCategory', label: 'Account Category' },
  { id: 'accountUserName', label: 'Account Username' },
  { id: 'amountPaid', label: 'Amount', align: 'right' },
  { id: 'prepaid', label: 'Prepaid', align: 'center' },
  { id: 'paymentMethod', label: 'Payment Method' },
  { id: 'paymentDate', label: 'Date' },
  { id: 'remark', label: 'Remark' },
  { id: '', label: '' },
];

type Props = {
  order: 'asc' | 'desc';
  orderBy: string;
  rowCount: number;
  numSelected: number;
  onSort: (id: string) => void;
  onSelectAllRows: (checked: boolean) => void;
};

export function VoucherTableHead({
  order,
  orderBy,
  rowCount,
  numSelected,
  onSort,
  onSelectAllRows,
}: Props) {
  const createSortHandler = (property: string) => () => {
    onSort(property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            checked={rowCount > 0 && numSelected === rowCount}
            indeterminate={numSelected > 0 && numSelected < rowCount}
            onChange={(e) => onSelectAllRows(e.target.checked)}
          />
        </TableCell>
        {headLabel.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || 'left'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.id ? (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
              >
                {headCell.label}
                {orderBy === headCell.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            ) : (
              headCell.label
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
