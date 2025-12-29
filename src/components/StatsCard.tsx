import { Card, CardContent } from '@design-system/components';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
}

export default function StatsCard({ title, value, subtitle, icon }: StatsCardProps) {
  return (
    <Card variant="elevated" padding="md">
      <CardContent>
        <div className={styles.content}>
          <div className={styles.textContent}>
            <p className={styles.title}>{title}</p>
            <p className={styles.value}>{value}</p>
            {subtitle && (
              <p className={styles.subtitle}>{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={styles.icon}>{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

