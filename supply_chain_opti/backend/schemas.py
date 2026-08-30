from pydantic import BaseModel
from typing import Optional, List, Dict


class Supplier(BaseModel):
    id: Optional[int] = None
    name: str
    location: str
    lat: float
    lon: float
    capacity: float
    procurement_cost: float
    reliability: float = 0.95
    active: bool = True


class Plant(BaseModel):
    id: Optional[int] = None
    name: str
    location: str
    lat: float
    lon: float
    capacity: float
    production_cost: float
    fixed_cost: float = 0
    active: bool = True


class Warehouse(BaseModel):
    id: Optional[int] = None
    name: str
    location: str
    lat: float
    lon: float
    capacity: float
    fixed_cost: float
    holding_cost: float
    active: bool = True
    is_potential: bool = False


class Customer(BaseModel):
    id: Optional[int] = None
    name: str
    location: str
    lat: float
    lon: float
    demand: float


class ScenarioRequest(BaseModel):
    demand_change_pct: float = 0          # e.g. 30 or -30
    transport_cost_multiplier: float = 1.0
    supplier_capacity_multiplier: float = 1.0
    warehouse_capacity_multiplier: float = 1.0
    disabled_supplier_ids: List[int] = []
    disabled_warehouse_ids: List[int] = []
    activate_potential_warehouse_ids: List[int] = []
    label: str = "Scenario"


class DisruptionRequest(BaseModel):
    node_type: str   # "supplier" | "plant" | "warehouse"
    node_id: int
