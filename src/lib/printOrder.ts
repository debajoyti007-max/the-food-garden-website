import type { Order } from '../types'
import { STORE_NAME, formatOrderId } from './business'

export function printOrderInvoice(order: Order) {
  const shortId = formatOrderId(order.id)
  const rows = order.items
    .map(
      (it) =>
        `<tr><td>${it.emoji} ${it.name} (${it.portion})</td><td>${it.qty}</td><td>₹${it.unitPrice}</td><td>₹${it.unitPrice * it.qty}</td></tr>`,
    )
    .join('')

  const html = `<!DOCTYPE html><html><head><title>Bill ${shortId}</title>
  <style>
    body{font-family:'Poppins','Hind Siliguri',system-ui,sans-serif;padding:20px;color:#111}
    h1{margin:0 0 4px;font-size:20px} .muted{color:#666;font-size:13px}
    table{width:100%;border-collapse:collapse;margin-top:14px}
    th,td{border-bottom:1px solid #ddd;padding:6px 4px;text-align:left;font-size:13px}
    .tot{margin-top:14px;font-size:14px}
  </style></head><body>
  <h1>${STORE_NAME}</h1>
  <p class="muted">Order #${shortId} · ${new Date(order.createdAt).toLocaleString()}</p>
  <p><strong>Customer: ${order.userName} (${order.phone})</strong><br/>
  Type: <b>${order.orderType === 'dine_in' ? `Dine-In (${order.tableNo})` : order.orderType === 'takeaway' ? 'Highway Takeaway' : `Delivery (${order.address})`}</b></p>
  <table><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="tot">
    <div>Total: <strong>₹${order.total}</strong></div>
    <div>Advance Paid: ₹${order.advanceAmount}</div>
    <div>Balance Due: ₹${Math.max(0, order.total - order.advanceAmount)}</div>
    <div>UTR: ${order.utr}</div>
  </div>
  <script>window.onload=()=>window.print()</script>
  </body></html>`

  const w = window.open('', '_blank', 'width=480,height=700')
  if (w) {
    w.document.write(html)
    w.document.close()
  }
}

export function printThermalReceipt(order: Order) {
  printOrderInvoice(order)
}
