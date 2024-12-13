from flask import Flask, render_template, request, jsonify
from models import Session, TaxPayment, Base
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tax-payments', methods=['GET'])
def get_tax_payments():
    session = Session()
    tax_payments = session.query(TaxPayment).all()
    session.close()
    return jsonify([payment.to_dict() for payment in tax_payments])

@app.route('/tax-payments/filter', methods=['GET'])
def filter_tax_payments():
    due_date = request.args.get('due_date')
    session = Session()
    
    try:
        # Parse the due_date string into a datetime object
        due_date = datetime.strptime(due_date, '%m/%d/%Y').date()

        # Use the filter instead of filter_by for more flexibility
        filtered_payments = session.query(TaxPayment).filter(TaxPayment.due_date == due_date).all()

        session.close()
        return jsonify([payment.to_dict() for payment in filtered_payments])
    except ValueError as e:
        session.close()
        return jsonify([])

@app.route('/tax-payments', methods=['POST'])
def create_tax_payment():
    data = request.json
    session = Session()
    
    new_payment = TaxPayment(
        company=data['company'],
        amount=float(data['amount']),
        payment_date=datetime.strptime(data['payment_date'], '%m/%d/%Y') if data['payment_date'] != 'NA' else None,
        status=data['status'],
        due_date=datetime.strptime(data['due_date'], '%m/%d/%Y')
    )
    
    session.add(new_payment)
    session.commit()
    payment_dict = new_payment.to_dict()
    session.close()
    
    return jsonify(payment_dict), 201

@app.route('/tax-payments/<int:payment_id>', methods=['PUT'])
def update_tax_payment(payment_id):
    data = request.json
    session = Session()
    
    payment = session.query(TaxPayment).get(payment_id)
    if payment:
        payment.company = data['company']
        payment.amount = float(data['amount'])
        payment.payment_date = datetime.strptime(data['payment_date'], '%m/%d/%Y') if data['payment_date'] != 'NA' else None
        payment.status = data['status']
        payment.due_date = datetime.strptime(data['due_date'], '%m/%d/%Y')        
        
        session.commit()
        payment_dict = payment.to_dict()
        session.close()
        
        return jsonify(payment_dict)
    
    session.close()
    return jsonify({'error': 'Payment not found'}), 404

@app.route('/tax-payments/<int:payment_id>', methods=['DELETE'])
def delete_tax_payment(payment_id):
    session = Session()
    payment = session.query(TaxPayment).get(payment_id)
    
    if payment:
        session.delete(payment)
        session.commit()
        session.close()
        return '', 204
    
    session.close()
    return jsonify({'error': 'Payment not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)