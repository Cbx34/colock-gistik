import { Boxes, MoveRight, TriangleAlert } from 'lucide-react';

const stock = [
  { sku: 'CBOX-S', name: 'Colock-Box Small', qty: 1840, zone: 'A-01' },
  { sku: 'CBOX-M', name: 'Colock-Box Medium', qty: 312, zone: 'A-04' },
  { sku: 'KIT-FRAGILE', name: 'Kit protection fragile', qty: 89, zone: 'B-12' },
];

export default function Stock() {
  return (
    <section className="module-page">
      <div className="module-actions"><button><Boxes /> Inventaire</button><button className="secondary"><MoveRight /> Transfert</button></div>
      <div className="data-list">
        {stock.map((item) => <article className="data-row" key={item.sku}><strong>{item.sku}</strong><span>{item.name}</span><span>Zone {item.zone}</span><em className={item.qty < 100 ? 'danger' : ''}>{item.qty} unités</em>{item.qty < 100 && <TriangleAlert />}</article>)}
      </div>
    </section>
  );
}
