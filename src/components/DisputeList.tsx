'use client';

import Link from 'next/link';
import { Dispute } from '../types';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
} from '@design-system/components';
import { formatDateTime } from '@design-system/utils';

interface DisputeListProps {
  disputes: Dispute[];
  onStatusChange?: (id: string, status: string) => void;
}

export default function DisputeList({ disputes, onStatusChange }: DisputeListProps) {
  const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return 'success';
      case 'open':
        return 'error';
      case 'in_review':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleVariant = (role: string): 'info' | 'default' => {
    return role === 'seller' ? 'info' : 'default';
  };

  return (
    <Table striped hoverable>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Auction</TableHead>
          <TableHead>Filed By</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {disputes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
              No disputes found
            </TableCell>
          </TableRow>
        ) : (
          disputes.map((dispute) => (
            <TableRow key={dispute.id}>
              <TableCell>
                <Link
                  href={`/disputes/${dispute.id}`}
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  #{dispute.id.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell>
                {dispute.auction ? (
                  <Link
                    href={`/auctions/${dispute.auction.id}`}
                    style={{
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    {dispute.auction.title}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                )}
              </TableCell>
              <TableCell>
                {dispute.filer ? (
                  <Link
                    href={`/users/${dispute.filed_by}`}
                    style={{
                      color: 'var(--accent-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    {dispute.filer.name || dispute.filer.email}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text-secondary)' }}>User {dispute.filed_by.slice(0, 8)}</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={getRoleVariant(dispute.filed_by_role)} size="sm">
                  {dispute.filed_by_role}
                </Badge>
              </TableCell>
              <TableCell style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {dispute.reason}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(dispute.status)} size="sm">
                  {dispute.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDateTime(dispute.created_at)}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <Link href={`/disputes/${dispute.id}`}>
                    <Button variant="primary" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
