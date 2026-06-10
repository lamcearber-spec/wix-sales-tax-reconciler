import { InfoPage } from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy">
      <p>
        Sales Tax Reconciler reads Wix order and transaction data only to compute period-level tax reconciliation
        summaries. Generated reports retain order references, tax amounts, dates, and jurisdictions, not buyer names,
        emails, phone numbers, or street addresses.
      </p>
      <p>
        The app stores only seeded rate-table data and cached period summaries. It does not write to Wix, issue refunds,
        edit orders, or file tax returns.
      </p>
      <p>Contact: support@konverter-pro.de</p>
    </InfoPage>
  );
}
