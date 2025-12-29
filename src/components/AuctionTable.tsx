'use client';

import Link from 'next/link';
import { Auction } from '../types';
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
import { formatCurrency, formatDateTime } from '@design-system/utils';

interface AuctionTableProps {
  auctions: Auction[];
  onDelete?: (id: string) => void;
}

export default function AuctionTable({ auctions, onDelete }: AuctionTableProps) {
  const getStatusVariant = (status: string): 'success' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Table striped hoverable>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Starting Price</TableHead>
          <TableHead>Current Bid</TableHead>
          <TableHead>End Time</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auctions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
              No auctions found
            </TableCell>
          </TableRow>
        ) : (
          auctions.map((auction) => (
            <TableRow key={auction.id}>
              <TableCell>
                <Link
                  href={`/auctions/${auction.id}`}
                  style={{
                    color: 'var(--accent-primary)',
                    textDecoration: 'none',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  {auction.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(auction.status)} size="sm">
                  {auction.status}
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(auction.starting_price)}</TableCell>
              <TableCell style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {formatCurrency(auction.current_bid || auction.starting_price)}
              </TableCell>
              <TableCell>{formatDateTime(auction.end_time)}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <Link href={`/auctions/${auction.id}`}>
                    <Button variant="primary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(auction.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

