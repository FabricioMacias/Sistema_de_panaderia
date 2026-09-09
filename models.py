from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    password = db.Column(db.String(100))
    rol = db.Column(db.String(20))

    ventas = db.relationship('Venta', backref='usuario', lazy=True)

class TipoProducto(db.Model):
    __tablename__ = 'tipos_producto'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    productos = db.relationship('Producto', backref='tipo_relacion', lazy=True)


class CategoriaProducto(db.Model):
    __tablename__ = 'categorias_producto'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    productos = db.relationship('Producto', backref='categoria_relacion', lazy=True)

class Temporada(db.Model):
    __tablename__ = 'temporadas'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False, unique=True)

    productos = db.relationship('Producto', backref='temporada_relacion', lazy=True)


class Producto(db.Model):
    __tablename__ = 'productos'
    id = db.Column(db.String(20), primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.String(255),nullable=False)
    precio = db.Column(db.Numeric(10,2), nullable=False)
    stock = db.Column(db.Integer, nullable=False)
    tipo = db.Column(db.String(50),nullable=False)
    categoria =db.Column(db.String(100),nullable=False)
    temporada = db.Column(db.String(100),nullable=False)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow)
    imagen = db.Column(db.String(200),nullable=False) 
    
    tipo_id = db.Column(db.Integer, db.ForeignKey('tipos_producto.id', ondelete='SET NULL'))
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias_producto.id', ondelete='SET NULL'))
    temporada_id = db.Column(db.Integer, db.ForeignKey('temporadas.id', ondelete='SET NULL'))

    
    detalle_ventas = db.relationship('DetalleVenta', backref='producto_rel', lazy=True)
    inventarios = db.relationship('Inventario', backref='producto_rel', lazy=True)

class Inventario(db.Model):
    __tablename__ = 'inventario'
    id = db.Column(db.Integer, primary_key=True)
    producto_id = db.Column(db.String(20), db.ForeignKey('productos.id', ondelete="CASCADE"))
    cantidad = db.Column(db.Integer)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    
    

class Venta(db.Model):
    __tablename__ = 'ventas'
    id = db.Column(db.Integer, primary_key=True)
    total = db.Column(db.Numeric(10,2), nullable=False)
    pago = db.Column(db.Numeric(10,2), nullable=False)
    cambio = db.Column(db.Numeric(10,2), nullable=False)
    fecha = db.Column(db.DateTime, default=datetime.utcnow)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'))  
    
    detalles = db.relationship('DetalleVenta', backref='venta_rel', lazy=True, cascade="all, delete-orphan")

class DetalleVenta(db.Model):
    __tablename__ = 'detalle_ventas'
    id = db.Column(db.Integer, primary_key=True)
    venta_id = db.Column(db.Integer, db.ForeignKey('ventas.id'))
    producto_id = db.Column(db.String(20), db.ForeignKey('productos.id'))
    cantidad = db.Column(db.Integer)
    precio = db.Column(db.Numeric(10,2), nullable=False)
    subtotal = db.Column(db.Numeric(10,2), nullable=False)
    
    
    