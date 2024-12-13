from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()
engine = create_engine('sqlite:///tax_database.db')
Session = sessionmaker(bind=engine)

class TaxPayment(Base):
    __tablename__ = 'tax_payments'

    id = Column(Integer, primary_key=True)
    company = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date)
    status = Column(String, default='unpaid')
    due_date = Column(Date, nullable=False)

    def __repr__(self):
        return f"<TaxPayment(id={self.id}, company='{self.company}', amount={self.amount}, due_date={self.due_date})>"

    def to_dict(self):
        return {
            'id': self.id,
            'company': self.company,
            'amount': self.amount,
            'payment_date': self.payment_date.strftime('%m/%d/%Y') if self.payment_date else None,
            'status': self.status,
            'due_date': self.due_date.strftime('%m/%d/%Y')
        }

# Create tables
Base.metadata.create_all(engine)