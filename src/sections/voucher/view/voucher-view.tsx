import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { DashboardContent } from 'src/layouts/dashboard';
import { getVouchers, createVoucher, deleteVoucher, updateVoucher } from 'src/api/voucherApi';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../../user/table-no-data';
import { VoucherTableRow } from '../voucher-table-row';
import { VoucherTableHead } from '../voucher-table-head';
import { VoucherCreateForm } from '../voucher-create-form';
import { VoucherSlipDialog } from '../voucher-slip-dialog';
import { TableEmptyRows } from '../../user/table-empty-rows';
import { VoucherTableToolbar } from '../voucher-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import type { VoucherProps } from '../voucher-table-row';

// ----------------------------------------------------------------------

export function VoucherView() {
  const table = useTable();

  const [vouchers, setVouchers] = useState<VoucherProps[]>([]);
  const [filterName, setFilterName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherProps | null>(null);
  const [viewingVoucher, setViewingVoucher] = useState<VoucherProps | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Voucher created successfully!');

  const fetchVoucherRows = useCallback(async (searchTerm = '') => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const query = searchTerm.trim();
      const response = await getVouchers(query ? { search: query } : undefined);
      const rawRows = extractVoucherList(response.data);
      const mappedRows = rawRows.map(mapVoucherRow).filter((row): row is VoucherProps => !!row);
      setVouchers(mappedRows);
    } catch (error) {
      setLoadError(`Failed to load vouchers from backend. ${getErrorMessage(error)}`);
      setVouchers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVoucherRows(filterName);
    }, 350);

    return () => clearTimeout(timeout);
  }, [fetchVoucherRows, filterName]);

  const dataFiltered: VoucherProps[] = applyFilter({
    inputData: vouchers,
    comparator: getComparator(table.order, table.orderBy),
    filterName: '',
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleCreateVoucher = useCallback(
    async (newVoucher: Omit<VoucherProps, 'id'>) => {
      try {
        const response = await createVoucher(newVoucher);
        const createdVoucher = mapVoucherRow(response.data);

        if (createdVoucher) {
          setVouchers((prev) => [createdVoucher, ...prev]);
        } else {
          await fetchVoucherRows(filterName);
        }

        setSuccessMessage('Voucher created successfully!');
        setShowSuccess(true);
      } catch (error) {
        setLoadError(`Failed to create voucher. ${getErrorMessage(error)}`);
      }
    },
    [fetchVoucherRows, filterName]
  );

  const handleUpdateVoucher = useCallback(
    async (updatedVoucher: Omit<VoucherProps, 'id'>) => {
      if (!editingVoucher) return;

      try {
        const response = await updateVoucher(editingVoucher.id, updatedVoucher);
        const mappedVoucher = mapVoucherRow(response.data);

        if (mappedVoucher) {
          setVouchers((prev) =>
            prev.map((voucher) => (voucher.id === editingVoucher.id ? mappedVoucher : voucher))
          );
        } else {
          await fetchVoucherRows(filterName);
        }

        setEditingVoucher(null);
        setOpenCreateForm(false);
        setSuccessMessage('Voucher updated successfully!');
        setShowSuccess(true);
      } catch (error) {
        setLoadError(`Failed to update voucher. ${getErrorMessage(error)}`);
      }
    },
    [editingVoucher, fetchVoucherRows, filterName]
  );

  const handleDeleteVoucher = useCallback(async (voucherId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this voucher?');
    if (!confirmed) return;

    try {
      await deleteVoucher(voucherId);
      setVouchers((prev) => prev.filter((voucher) => voucher.id !== voucherId));
      setSuccessMessage('Voucher deleted successfully!');
      setShowSuccess(true);
    } catch (error) {
      setLoadError(`Failed to delete voucher. ${getErrorMessage(error)}`);
    }
  }, []);

  const handleOpenCreate = useCallback(() => {
    setEditingVoucher(null);
    setOpenCreateForm(true);
  }, []);

  const handleOpenEdit = useCallback((voucher: VoucherProps) => {
    setEditingVoucher(voucher);
    setOpenCreateForm(true);
  }, []);

  const handleOpenSlip = useCallback((voucher: VoucherProps) => {
    setViewingVoucher(voucher);
  }, []);

  const handleCloseSlip = useCallback(() => {
    setViewingVoucher(null);
  }, []);

  const handleCloseForm = useCallback(() => {
    setOpenCreateForm(false);
    setEditingVoucher(null);
  }, []);

  const handleSubmitForm = useCallback(
    async (voucher: Omit<VoucherProps, 'id'>) => {
      if (editingVoucher) {
        await handleUpdateVoucher(voucher);
        return;
      }

      await handleCreateVoucher(voucher);
    },
    [editingVoucher, handleCreateVoucher, handleUpdateVoucher]
  );

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Vouchers
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenCreate}
        >
          New voucher
        </Button>
      </Box>

      <Card>
        {loadError && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
            {loadError}
          </Alert>
        )}

        <VoucherTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 1500 }}>
              <VoucherTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={vouchers.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked: boolean) =>
                  table.onSelectAllRows(
                    checked,
                    vouchers.map((v) => v.id)
                  )
                }
              />
              <TableBody>
                {isLoading && vouchers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      Loading vouchers...
                    </TableCell>
                  </TableRow>
                )}

                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <VoucherTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onView={() => handleOpenSlip(row)}
                      onEdit={() => handleOpenEdit(row)}
                      onDelete={() => handleDeleteVoucher(row.id)}
                    />
                  ))}

                <TableEmptyRows
                  height={68}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, vouchers.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={vouchers.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <VoucherCreateForm
        open={openCreateForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        initialData={editingVoucher}
        title={editingVoucher ? 'Update Voucher' : 'Create New Voucher'}
        submitButtonText={editingVoucher ? 'Update' : 'Create'}
      />

      <VoucherSlipDialog open={!!viewingVoucher} onClose={handleCloseSlip} voucher={viewingVoucher} />

      <Snackbar
        open={showSuccess}
        autoHideDuration={2500}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('buyerName');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}

function extractVoucherList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const container = payload as Record<string, unknown>;

  if (Array.isArray(container.data)) return container.data;
  if (Array.isArray(container.items)) return container.items;
  if (Array.isArray(container.results)) return container.results;
  if (container.data && typeof container.data === 'object') {
    const nested = container.data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items;
    if (Array.isArray(nested.results)) return nested.results;
  }

  return [];
}

function mapVoucherRow(item: unknown): VoucherProps | null {
  if (!item || typeof item !== 'object') return null;

  const row = item as Record<string, unknown>;
  const buyerName = getString(row, ['buyerName', 'buyer_name']) || '-';
  const buyerPhoneNumber =
    getString(row, ['buyerPhoneNumber', 'buyerPhoneNo', 'buyer_phone_number', 'buyer_phone_no', 'phone']) ||
    '-';
  const serviceType = getString(row, ['serviceType', 'service_type']) || '-';
  const accountCategory = getString(row, ['accountCategory', 'account_category']) || '-';
  const accountUserName =
    getString(row, ['accountUserName', 'accountUsername', 'account_username', 'accountUsrName', 'account_usr_name']) ||
    '-';

  const id = String(row.id ?? row._id ?? row.voucherId ?? row.voucher_id ?? buyerName);
  const amountPaid = getNumber(row, ['amountPaid', 'amount_paid']);
  const prepaid = getBoolean(row, ['prepaid']);
  const paymentMethod = getString(row, ['paymentMethod', 'payment_method']) || '-';
  const paymentDate = getString(row, ['paymentDate', 'payment_date']) || '';
  const remark = getOptionalString(row, ['remark']);

  return {
    id,
    buyerName,
    buyerPhoneNumber,
    serviceType,
    accountCategory,
    accountUserName,
    amountPaid,
    prepaid,
    paymentMethod,
    paymentDate: normalizeDate(paymentDate),
    remark,
  };
}

function getString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function getOptionalString(source: Record<string, unknown>, keys: string[]): string | undefined {
  const value = getString(source, keys);
  return value || undefined;
}

function getNumber(source: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return 0;
}

function getBoolean(source: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
  }

  return false;
}

function normalizeDate(value: string): string {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Please check API URL or backend availability.';
}
