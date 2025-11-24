GET http://localhost:3000/health

POST http://localhost:3000/api/publications
Content-Type: application/json

{
  "index": "11111",
  "type": "газета",
  "title": "Новая газета",
  "monthly_cost": 18.50
}

GET http://localhost:3000/api/publications?page=1&limit=5&type=газета&minCost=10&maxCost=20

GET http://localhost:3000/api/publications?search=Белоруссия

GET http://localhost:3000/api/publications/12345

PUT http://localhost:3000/api/publications/12345
Content-Type: application/json

{
  "monthly_cost": 16.00
}

DELETE http://localhost:3000/api/publications/11111

POST http://localhost:3000/api/recipients
Content-Type: application/json

{
  "full_name": "Козлов Дмитрий Петрович",
  "street": "Гоголя",
  "house": "15",
  "apartment": "12"
}

GET http://localhost:3000/api/recipients?search=Иванов&street=Ленина

POST http://localhost:3000/api/subscriptions
Content-Type: application/json

{
  "recipient_id": 1,
  "publication_index": "54321",
  "duration_months": 3,
  "start_month": 4,
  "start_year": 2024
}


GET http://localhost:3000/api/subscriptions?recipient_id=1&duration=6