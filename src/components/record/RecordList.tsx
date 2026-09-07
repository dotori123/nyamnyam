import type { FeedRecord } from '../../types';
import RecordCard from './RecordCard';
import './RecordList.scss';

export default function RecordList({ records }: { records: FeedRecord[] }) {
  return (
    <ul className="record-list">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
    </ul>
  );
}
