export const PAYPAL_RECEIVER = "expiri2009@icloud.com";
export const PAYPAL_CHECKOUT = "https://www.paypal.com/cgi-bin/webscr";
export const PAYPAL_IPN_VERIFY = "https://ipnpb.paypal.com/cgi-bin/webscr";

export function paypalCheckoutFields(input: {
  origin: string;
  orderId: string;
  packId: string;
  nox: number;
  euro: number;
}): Record<string, string> {
  const origin = input.origin.replace(/\/+$/, "");
  return {
    cmd: "_xclick",
    business: PAYPAL_RECEIVER,
    item_name: `${input.nox} NOX · OFFCHAT`,
    item_number: input.packId,
    amount: input.euro.toFixed(2),
    currency_code: "EUR",
    custom: input.orderId,
    invoice: input.orderId,
    no_shipping: "1",
    no_note: "1",
    rm: "1",
    lc: "DE",
    charset: "utf-8",
    return: `${origin}/online?paypal=return&order=${encodeURIComponent(input.orderId)}`,
    cancel_return: `${origin}/online?paypal=cancel`,
    notify_url: `${origin}/api/paypal-ipn`,
  };
}

export function submitPaypalForm(fields: Record<string, string>) {
  if (typeof document === "undefined") return;
  const form = document.createElement("form");
  form.method = "POST";
  form.action = PAYPAL_CHECKOUT;
  form.acceptCharset = "UTF-8";
  form.style.display = "none";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
