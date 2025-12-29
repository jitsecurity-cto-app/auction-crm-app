'use client';

import Link from 'next/link';
import { User } from '../types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Button } from '@design-system/components';
import { formatDateTime } from '@design-system/utils';

interface UserTableProps {
  users: User[];
  onDelete?: (id: string) => void;
}

export default function UserTable({ users, onDelete }: UserTableProps) {
  return (
    <Table striped hoverable>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Password Hash</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {user.name}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'info' : 'default'} size="sm">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell style={{ fontSize: 'var(--font-size-xs)', fontFamily: 'var(--font-family-mono)' }}>
                {/* Intentionally display password hash (security vulnerability) */}
                {user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'N/A'}
              </TableCell>
              <TableCell>{formatDateTime(user.created_at)}</TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <Link href={`/users/${user.id}`}>
                    <Button variant="primary" size="sm">
                      Edit
                    </Button>
                  </Link>
                  {onDelete && (
                    <Button variant="danger" size="sm" onClick={() => onDelete(user.id)}>
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

