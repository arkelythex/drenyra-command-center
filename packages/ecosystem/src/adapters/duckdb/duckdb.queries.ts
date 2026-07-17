/**
 * Pre-built analytical queries for Drenyra fiscal analytics via DuckDB.
 */

export const ANALYTICS_QUERIES = {
	/** Cashflow summary for a period */
	cashflowSummary: `
    SELECT
      date,
      income,
      expenses,
      net,
      running_balance
    FROM cashflow_daily
    WHERE date >= $1 AND date <= $2
    ORDER BY date
  `,

	/** Monthly IGV position */
	igvMonthlyPosition: `
    SELECT
      month,
      igv_credit,
      igv_debit,
      net_igv,
      CASE
        WHEN net_igv > 0 THEN 'PAYABLE'
        WHEN net_igv < 0 THEN 'CREDIT'
        ELSE 'ZERO'
      END AS position
    FROM igv_trends
    ORDER BY month DESC
    LIMIT 12
  `,

	/** SIRE compras/ventas consolidated by period */
	sireConsolidated: `
    SELECT
      period,
      SUM(CASE WHEN type = 'COMPRAS' THEN total ELSE 0 END) AS compras_total,
      SUM(CASE WHEN type = 'COMPRAS' THEN total_igv ELSE 0 END) AS compras_igv,
      SUM(CASE WHEN type = 'VENTAS' THEN total ELSE 0 END) AS ventas_total,
      SUM(CASE WHEN type = 'VENTAS' THEN total_igv ELSE 0 END) AS ventas_igv,
      SUM(CASE WHEN type = 'VENTAS' THEN total ELSE 0 END) -
      SUM(CASE WHEN type = 'COMPRAS' THEN total_igv ELSE 0 END) AS igv_a_pagar
    FROM sire_summary
    GROUP BY period
    ORDER BY period DESC
  `,

	/** Top suppliers by purchase volume */
	topSuppliers: `
    SELECT
      supplier_ruc,
      supplier_name,
      SUM(total_cents) / 100.0 AS total_amount,
      COUNT(*) AS invoice_count
    FROM purchases
    GROUP BY supplier_ruc, supplier_name
    ORDER BY total_amount DESC
    LIMIT 20
  `,

	/** Customer aging summary */
	customerAging: `
    SELECT
      customer_name,
      SUM(CASE WHEN days_overdue <= 30 THEN balance ELSE 0 END) AS current,
      SUM(CASE WHEN days_overdue > 30 AND days_overdue <= 60 THEN balance ELSE 0 END) AS aging_30_60,
      SUM(CASE WHEN days_overdue > 60 AND days_overdue <= 90 THEN balance ELSE 0 END) AS aging_60_90,
      SUM(CASE WHEN days_overdue > 90 THEN balance ELSE 0 END) AS aging_90_plus
    FROM (
      SELECT
        customer_name,
        DATEDIFF('day', due_date, CURRENT_DATE) AS days_overdue,
        balance
      FROM receivables
    )
    GROUP BY customer_name
    ORDER BY SUM(balance) DESC
  `,
} as const;
