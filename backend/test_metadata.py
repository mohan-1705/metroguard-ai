import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent))

from app.db.database import Base
from app.models import Train, SensorReading, Incident, Technician, MaintenanceOrder, Approval, AuditEvent

print("Registered tables:")
for table_name in Base.metadata.tables.keys():
    print("-", table_name)
