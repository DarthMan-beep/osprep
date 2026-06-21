def total_value():
    items = [
        ("Fridge", 600, 5),
        ("TV", 1500, 6),
    ]
    return sum(price * qty for _, price, qty in items)
