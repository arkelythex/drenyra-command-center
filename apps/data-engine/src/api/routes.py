"""
FastAPI Routes for Arkelythex Data Engine
High-performance financial data processing with Polars
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from src.services.banking_analyzer import BankingAnalyzer
from src.services.cashflow_analyzer import CashflowAnalyzer
from src.services.sire_processor import SireProcessor

router = APIRouter()


# ==========================================
# SIRE PROCESSING ENDPOINTS
# ==========================================


@router.post("/sire/compras")
async def process_sire_compras(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    result = SireProcessor.process_sire_compras(content)

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))

    return result


@router.post("/sire/ventas")
async def process_sire_ventas(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    result = SireProcessor.process_sire_ventas(content)

    if result.get("status") == "error":
        raise HTTPException(status_code=400, detail=result.get("message"))

    return result


# ==========================================
# CASHFLOW ANALYSIS ENDPOINTS
# ==========================================


class TransactionInput(BaseModel):
    date: str
    type: str
    amount: float
    category: str
    description: str | None = None


class CashflowAnalysisRequest(BaseModel):
    transactions: list[TransactionInput]
    start_date: str | None = None
    end_date: str | None = None


@router.post("/cashflow/analyze")
async def analyze_cashflow(request: CashflowAnalysisRequest):
    transactions_data = [tx.model_dump() for tx in request.transactions]

    result = CashflowAnalyzer.analyze_historical_cashflow(
        transactions_data=transactions_data,
        start_date=request.start_date,
        end_date=request.end_date,
    )
    return {
        "status": "success",
        "summary": {
            "totalIncome": result.get("total_income", 0.0),
            "totalExpenses": result.get("total_expenses", 0.0),
            "netCashflow": result.get("net_cashflow", 0.0),
        },
        **result,
    }


class CashflowForecastRequest(BaseModel):
    transactions: list[TransactionInput]
    forecast_days: int = Field(default=90, ge=1, le=365)


@router.post("/cashflow/forecast")
async def forecast_cashflow(request: CashflowForecastRequest):
    transactions_data = [tx.model_dump() for tx in request.transactions]

    result = CashflowAnalyzer.forecast_cashflow(
        historical_data=transactions_data,
        forecast_days=request.forecast_days,
    )

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {"status": "success", **result}


class CashflowAnomaliesRequest(BaseModel):
    transactions: list[TransactionInput]
    threshold_std: float = Field(default=2.0, ge=0.5, le=5.0)


@router.post("/cashflow/anomalies")
async def detect_cashflow_anomalies(request: CashflowAnomaliesRequest):
    transactions_data = [tx.model_dump() for tx in request.transactions]

    result = CashflowAnalyzer.detect_cashflow_anomalies(
        transactions_data=transactions_data,
        threshold_std=request.threshold_std,
    )

    return {"status": "success", **result}


# ==========================================
# BANKING ANALYSIS ENDPOINTS
# ==========================================


class BankTransaction(BaseModel):
    date: str
    description: str
    net_amount: float
    balance: float | None = None


class ReconciliationRequest(BaseModel):
    bank_transactions: list[BankTransaction]
    system_transactions: list[TransactionInput]
    tolerance_days: int = 3
    tolerance_amount: float = 0.01


@router.post("/banking/reconcile")
async def reconcile_transactions(request: ReconciliationRequest):
    bank_data = [tx.model_dump() for tx in request.bank_transactions]
    system_data = [tx.model_dump() for tx in request.system_transactions]

    result = BankingAnalyzer.reconcile_transactions(
        bank_transactions=bank_data,
        system_transactions=system_data,
        tolerance_days=request.tolerance_days,
        tolerance_amount=request.tolerance_amount,
    )

    return result


@router.post("/banking/parse-statement")
async def parse_bank_statement(
    file: UploadFile = File(...),
    bank_name: str = Form(default="generic"),
    file_format: str = Form(default="csv"),
):
    if file_format not in ("csv", "excel"):
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'excel'")

    if bank_name not in ("bcp", "interbank", "bbva", "generic"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported bank. Use: bcp, interbank, bbva, or generic",
        )

    content = await file.read()
    try:
        result = BankingAnalyzer.parse_bank_statement(
            file_content=content,
            file_format=file_format,
            bank_name=bank_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse statement: {str(e)}")

    return {
        "status": "success",
        "parsed_count": len(result),
        "transactions": result,
    }


class BankingPatternsRequest(BaseModel):
    transactions: list[BankTransaction]


@router.post("/banking/patterns")
async def analyze_bank_patterns(request: BankingPatternsRequest):
    transactions_data = [tx.model_dump() for tx in request.transactions]

    result = BankingAnalyzer.analyze_bank_patterns(
        transactions=transactions_data,
    )

    return {"status": "success", **result}


class CashPositionRequest(BaseModel):
    transactions: list[BankTransaction]
    start_balance: float = 0.0


@router.post("/banking/cash-position")
async def calculate_cash_position(request: CashPositionRequest):
    transactions_data = [tx.model_dump() for tx in request.transactions]

    result = BankingAnalyzer.calculate_cash_position(
        transactions=transactions_data,
        start_balance=request.start_balance,
    )

    return {"status": "success", **result}


# ==========================================
# HEALTH CHECK
# ==========================================


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "data-engine",
        "engine": "Polars (Rust)",
    }
