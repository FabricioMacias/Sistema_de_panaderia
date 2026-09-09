from flask import Flask,flash, render_template, request, redirect, session, url_for, Response, jsonify, send_file
from models import db, TipoProducto,CategoriaProducto,Temporada,Usuario, Producto, Inventario, Venta, DetalleVenta
from config import *
from datetime import datetime
import pandas as pd
from datetime  import date
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from decimal import Decimal
#cargar .env si existe
load_dotenv()

app = Flask(__name__)
app.secret_key = "clave_secreta"
app.config.from_object(Config)

db.init_app(app)
#crear tablas
with app.app_context():
    db.create_all()
#Inicio
@app.route('/')

def login():
    return render_template('login.html')
    
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/login', methods=['POST'])
def validar_login():
    user = request.form['username']
    password = request.form['password']
    
    usuario = Usuario.query.filter_by(username=user, password=password).first()
    
    if usuario:
        session['usuario'] = usuario.username
        session['rol'] = usuario.rol
        session['usuario_id'] = usuario.id
         
        if usuario.rol == 'administrador':
            return redirect('/producto?seccion=dashboard')
        elif usuario.rol == 'operativo':
            return redirect('/producto?seccion=productos')
        else:
            return redirect('/producto?seccion=productos')
    else:
        return render_template('login.html', error="Usuario o contraseña incorrectos")

    
@app.route('/dashboard')
def dashboard():
    return redirect('/producto?seccion=dashboard')

@app.route('/producto')
def index():
    if 'usuario' not in session:
        return redirect('/login')

    productos = Producto.query.all()
    productos_venta = Producto.query.filter_by(tipo='producto').all()
    stock_bajo = Producto.query.filter(Producto.stock < 5).count()
    valor = db.session.query(db.func.sum(Producto.precio * Producto.stock)).scalar() or 0
    total_productos = Producto.query.count()
    seccion = request.args.get('seccion', 'dashboard')
    
    hoy = date.today()
    ganancias_hoy = db.session.query(db.func.sum(Venta.total)).filter(db.func.date(Venta.fecha) == hoy).scalar() or 0

    # 👇 CAMBIAR A layout.html (archivo principal con sidebar)
    return render_template('layout.html',  
        usuario=session['usuario'],
        rol=session['rol'],
        productos=productos,
        productos_venta=productos_venta,
        stock_bajo=stock_bajo,
        valor=valor,
        total_productos=total_productos,
        ganancias_hoy=ganancias_hoy,
        seccion=seccion
    )

@app.route('/usuarios')
def usuarios():
    return render_template('productos.html', seccion="usuarios")

@app.route('/producto2')
def producto2():
    if 'rol' not in session:
        return redirect('/login')  
    
    if session.get('rol') == 'admin':
        return redirect('/producto') 
    elif session.get('rol') == 'usuario':
        return render_template('producto.html', rol=session.get('rol'))
    else:
        return redirect('/login')
    

@app.route('/productos')
def productos():
    seccion = request.args.get('seccion', 'dashboard')
    if session.get('rol') != 'admin' and seccion == 'dashboard':
        seccion = 'productos'

    inventario = Inventario.query.all()  
    productos = Producto.query.all()

    hoy = date.today()

    ganancias_hoy = db.session.query(
        db.func.sum(Venta.total)
    ).filter(db.func.date(Venta.fecha) == hoy).scalar() or 0

    top_productos = db.session.query(
        Producto.nombre,
        db.func.sum(DetalleVenta.cantidad).label('total_vendidos')
    ).join(DetalleVenta).group_by(Producto.id)\
    .order_by(db.desc('total_vendidos')).limit(5).all()

    ventas_dias = db.session.query(
        db.func.date(Venta.fecha),
        db.func.sum(Venta.total)
    ).group_by(db.func.date(Venta.fecha)).all()

    fechas = [str(v[0]) for v in ventas_dias]
    totales = [float(v[1]) for v in ventas_dias]

    alertas = Producto.query.filter(Producto.stock < 5).all()
    
    return render_template('producto.html',
        seccion='productos', 
        productos=productos,
        ganancias_hoy=ganancias_hoy,
        top_productos=top_productos,
        fechas=fechas,
        totales=totales,
        alertas=alertas,
        inventario=inventario
        
        )


@app.route('/agregar_producto', methods=['POST'])
def agregar_producto():
    try:
        id_input = request.form['id']
        nombre = request.form['nombre']
        descripcion = request.form['descripcion']
        precio = Decimal(request.form['precio'])
        stock = int(request.form['stock'])
        tipo = request.form['tipo']
        categoria = request.form.get('categoria', '')
        temporada = request.form['temporada']
        
        if precio < 0 or stock < 0:
            flash("El precio y stock no pueden ser negativos", "danger")
            return redirect('/producto?seccion=productos')
        
        producto_existente = Producto.query.filter_by(id=id_input).first()

        if producto_existente:
            return """
            <script>
                alert(' El ID del producto ya existe en la base de datos');
                window.location.href='/producto?seccion=productos';
            </script>
            """


        existe = Producto.query.get(id_input)
        if existe:
            flash("El ID del producto ya existe. Usa otro ID", "danger")
            return redirect('/producto?seccion=productos')
        
        archivo = request.files.get('imagen')
        nombre_archivo = None
        
        if archivo and archivo.filename != '' and allowed_file(archivo.filename):
            ext = archivo.filename.rsplit('.', 1)[1].lower()
            nombre_archivo = f"{id_input}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
            nombre_archivo = secure_filename(nombre_archivo)
            
            ruta_completa = os.path.join(app.config['UPLOAD_FOLDER'], nombre_archivo)
            archivo.save(ruta_completa)
            
            print(f" IMAGEN GUARDADA: {ruta_completa}")
            print(f" Nombre guardado en BD: {nombre_archivo}")
            flash(" Producto agregado con imagen", "success")
        else:
            print(" No se recibió imagen, se usará NULL")
            nombre_archivo = None
            flash(" Producto agregado sin imagen", "info")
        
        tipo_obj = TipoProducto.query.filter_by(nombre=tipo).first()
        categoria_obj = CategoriaProducto.query.filter_by(nombre=categoria).first()
        temporada_obj = Temporada.query.filter_by(nombre=temporada).first()


        nuevo = Producto(
            id=id_input,
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            stock=stock,
            tipo=tipo,
            categoria=categoria,
            temporada=temporada,
            imagen=nombre_archivo,  
            fecha_actualizacion=datetime.utcnow(),
            tipo_id=tipo_obj.id if tipo_obj else None,

            categoria_id=categoria_obj.id if categoria_obj else None,

            temporada_id=temporada_obj.id if temporada_obj else None
        )
        
        db.session.add(nuevo)
        nuevo_inventario = Inventario(
            producto_id=id_input,
            cantidad=stock
        )

        db.session.add(nuevo_inventario)
        db.session.commit()
        
        producto_verificado = Producto.query.get(id_input)
        print(f" Producto guardado - ID: {producto_verificado.id}, Imagen: {producto_verificado.imagen}")
        
        flash("Producto agregado exitosamente", "success")
        return redirect('/producto?seccion=productos')
        
    except Exception as e:
        db.session.rollback()
        print(f" ERROR: {e}")
        flash(f"Error al agregar producto: {str(e)}", "danger")
        return redirect('/producto?seccion=productos')




@app.route('/editar_producto/<id>')
def editar_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return "Producto no encontrado"
    return render_template('editar_producto.html', producto=producto)

@app.route('/actualizar_producto/<id>', methods=['POST'])
def actualizar_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return "Producto no encontrado"
    producto.nombre = request.form['nombre']
    producto.descripcion = request.form['descripcion']
    producto.precio = Decimal(request.form['precio'])
    producto.stock = int(request.form['stock'])
    producto.tipo = request.form['tipo']

    # ESTOS FALTABAN
    producto.categoria = request.form['categoria']
    producto.temporada = request.form['temporada']

    # IMAGEN
    imagen = request.files.get('imagen')

    if imagen and imagen.filename != '':

        nombre_imagen = secure_filename(imagen.filename)

        ruta = os.path.join(
            app.config['UPLOAD_FOLDER'],
            nombre_imagen
        )

        imagen.save(ruta)

        producto.imagen = nombre_imagen
    db.session.commit()
    return redirect('/producto?seccion=productos')

@app.route('/ver_producto/<id>')
def ver_producto(id):
    producto = Producto.query.get(id)
    
    if not producto:
        return "Producto no encontrado", 404
    return render_template('ver_producto.html', producto=producto)



@app.route('/eliminar_producto/<id>', methods=['POST'])
def eliminar_producto(id):
    if 'usuario' not in session:
        return """
        <script>
            alert('Debes iniciar sesión');
            window.location.href = '/login';
        </script>
        """
    rol_usuario = session.get('rol', '')
    print(f"Rol del usuario: {rol_usuario}")  # Para depurar
    
    if rol_usuario != 'administrador':
        return """
        <script>
            alert('No tienes permiso para eliminar. Solo administradores.');
            window.location.href = '/producto?seccion=productos';
        </script>
        """
   # Buscar producto

    producto = Producto.query.get(id)
    if not producto:
         return "Producto no encontrado"

    if producto.imagen and producto.imagen != '' and producto.imagen != 'default.png':
        import os
        ruta_imagen = os.path.join(app.config['UPLOAD_FOLDER'], producto.imagen)
        if os.path.exists(ruta_imagen):
            try:
                os.remove(ruta_imagen)
                print(f" Imagen eliminada: {ruta_imagen}")
            except Exception as e:
                print(f" Error al eliminar imagen: {e}")

    Inventario.query.filter_by(producto_id=id).delete()
    producto = Producto.query.get(id)
    #Eliminar producto
    db.session.delete(producto)
    db.session.commit()
    return redirect('/producto?seccion=productos')


@app.route('/inventario')
def inventario():
    if 'usuario' not in session:
        return redirect('/')

    productos = Producto.query.all()

    return render_template(
        'productos.html',
        productos=productos,
        seccion='inventario'
    )


@app.route('/agregar_inventario', methods=['POST'])
def agregar_inventario():
    producto_id = request.form['producto_id']
    cantidad = int(request.form['cantidad'])

    producto = Producto.query.get(producto_id)

    if not producto:
        return "Producto no existe"

    producto.stock += cantidad
    producto.fecha_actualizacion = datetime.utcnow()

    movimiento = Inventario(
        producto_id=producto.id,
        cantidad=cantidad
    )
    db.session.add(movimiento)
    db.session.commit()
    return redirect('/producto?seccion=inventario')

@app.route('/editar_inventario/<id>', methods=['GET'])
def editar_inventario_form(id):
    if session.get('rol') != 'administrador':
        flash('No tienes permiso', 'danger')
        return redirect('/producto?seccion=inventario')
    producto = Producto.query.get(id)
    if not producto:
        flash('Producto no encontrado', 'danger')
        return redirect('/producto?seccion=inventario')
    return render_template('editar_inventario.html', producto=producto)


@app.route('/actualizar_inventario/<id>', methods=['POST'])
def actualizar_inventario(id):
    if session.get('rol') != 'administrador':
        flash('No tienes permiso', 'danger')
        return redirect('/producto?seccion=inventario')
    try:
        producto = Producto.query.get(id)
        if not producto:
            flash('Producto no encontrado', 'danger')
            return redirect('/producto?seccion=inventario')
        producto.nombre = request.form['nombre']
        producto.tipo = request.form['tipo']
        producto.stock = int(request.form['stock'])
        
        
        producto.fecha_actualizacion = datetime.utcnow()

        archivo = request.files.get('imagen')
        if archivo and archivo.filename != '':
            ext = archivo.filename.rsplit('.', 1)[1].lower()
            if ext in {'png', 'jpg', 'jpeg', 'gif', 'webp'}:
                if producto.imagen and producto.imagen != 'default.png':
                    ruta_anterior = os.path.join(app.config['UPLOAD_FOLDER'], producto.imagen)
                    if os.path.exists(ruta_anterior):
                        os.remove(ruta_anterior)
                
                nombre_archivo = f"{id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.{ext}"
                nombre_archivo = secure_filename(nombre_archivo)
                ruta_nueva = os.path.join(app.config['UPLOAD_FOLDER'], nombre_archivo)
                archivo.save(ruta_nueva)
                producto.imagen = nombre_archivo
        
        db.session.commit()
        flash(' Producto actualizado correctamente', 'success')
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error: {str(e)}', 'danger')
    
    return redirect('/producto?seccion=inventario')



@app.route('/eliminar_inventario/<id>', methods=['POST'])
def eliminar_inventario(id):
    producto = Producto.query.get(id)
    if 'usuario' not in session:
        return """
        <script>
            alert('Debes iniciar sesión');
            window.location.href = '/login';
        </script>
        """
    rol_usuario = session.get('rol', '')
    print(f"Rol del usuario: {rol_usuario}")  
    
    if rol_usuario != 'administrador':
        return """
        <script>
            alert('No tienes permiso para eliminar. Solo administradores.');
            window.location.href = '/producto?seccion=productos';
        </script>
        """
    
    if not producto:
         return "Producto no encontrado"
 
    if producto.imagen and producto.imagen != '' and producto.imagen != 'default.png':
        import os
        ruta_imagen = os.path.join(app.config['UPLOAD_FOLDER'], producto.imagen)
        if os.path.exists(ruta_imagen):
            try:
                os.remove(ruta_imagen)
                print(f" Imagen eliminada: {ruta_imagen}")
            except Exception as e:
                print(f" Error al eliminar imagen: {e}")

    if producto:
        db.session.delete(producto)
        db.session.commit()
    return redirect('/producto?seccion=inventario')

@app.route('/exportar_excel')
def exportar_excel():
    productos = Producto.query.all()

    data = []
    for p in productos:
        data.append({
            "ID": p.id,
            "Nombre": p.nombre,
            "Descripcion":p.descripcion,
            "Tipo": p.tipo,
            "Precio":float(p.precio),
            "Stock": p.stock,
            "Fecha": p.fecha_actualizacion
        })

    df = pd.DataFrame(data)
    archivo = "inventario.xlsx"
    df.to_excel(archivo, index=False)

    return Response(
        open(archivo, "rb"),
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment;filename=inventario.xlsx"}
    )

@app.route('/ventas')
def ventas():
    productos_venta = Producto.query.filter_by(tipo='producto').all()
    return render_template('producto.html', seccion='ventas', productos_venta=productos_venta)

@app.route('/registrar_venta', methods=['POST'])
def registrar_venta():

    productos_ids = request.form.getlist('producto_id[]')
    cantidades = request.form.getlist('cantidad[]')
    pago = Decimal(request.form.get('pago', '0'))
    total = 0
    detalles = []
    for id, cantidad in zip(productos_ids, cantidades):

        if not id or not cantidad:
            continue

        cantidad = int(cantidad)
        producto = Producto.query.get(id)

        if not producto or producto.tipo != 'producto':
            continue

        if producto.stock < cantidad:
            return f"Stock insuficiente de {producto.nombre}"

        subtotal = producto.precio * cantidad
        total += subtotal

        detalles.append({
            "nombre": producto.nombre,
            "cantidad": cantidad,
            "precio": producto.precio,
            "subtotal": subtotal
        })

        producto.stock -= cantidad

    if pago < total:
        return "Pago insuficiente"

    cambio = pago - total

    venta = Venta(
        total=total,
        pago=pago,
        cambio=cambio,
        usuario_id=session['usuario_id'],
        

    )
    db.session.add(venta)

    db.session.flush()

   # Guardar detalles en detalle_ventas
    for detalle in detalles:
        detalle_venta = DetalleVenta(
            venta_id=venta.id,
            producto_id=productos_ids[detalles.index(detalle)],  # Obtener el ID del producto
            cantidad=detalle['cantidad'],
            precio=detalle['precio'],
            subtotal=detalle['subtotal']
        )
        db.session.add(detalle_venta)


    if total == 0:
        return "No seleccionaste productos válidos"

    if pago < total:
        return "Pago insuficiente"

    cambio = pago - total

    db.session.add(venta)
    db.session.commit()

    return render_template(
        "ticket.html",
        detalles=detalles,
        venta=venta,
        total=total,
        pago=pago,
        cambio=cambio
        
    )

@app.route('/eliminar_venta/<int:id>')
def eliminar_venta(id):
    if session.get('rol') != 'administrador':
        return """
        <script>
            alert('No tienes permiso para eliminar ventas. Solo administradores.');
            window.location.href = '/producto?seccion=ventas';
        </script>
        """
    try:
        venta = Venta.query.get_or_404(id)

        for d in venta.detalles:
            producto = Producto.query.get(d.producto_id)

            if producto:
                producto.stock += d.cantidad

        db.session.delete(venta)
        db.session.commit()

        return """
        <script>
            alert('Venta eliminada correctamente');
            window.location.href='/producto?seccion=ventas';
        </script>
        """

    except Exception as e:
        db.session.rollback()
        return f"Error: {repr(e)}"



@app.route('/api/ventas')
def api_ventas():
    if 'usuario' not in session:
        return jsonify([])
    ventas = Venta.query.order_by(Venta.fecha.desc()).all()
    return jsonify([{
        'id': v.id,
        'fecha': v.fecha.strftime('%Y-%m-%d'),
        'hora': v.fecha.strftime('%H:%M:%S'),
        'total': float(v.total),
        'pago': float(v.pago),
        'cambio': float(v.cambio),
        'vendedor': v.usuario.username if v.usuario else 'Sistema'
    } for v in ventas])

@app.route('/api/venta/<int:id>')
def api_venta_detalle(id):
    if 'usuario' not in session:
        return jsonify({'error': 'No autorizado'}), 401
    
    venta = Venta.query.get_or_404(id)
    detalles = DetalleVenta.query.filter_by(venta_id=id).all()
    
    return jsonify({
        'id': venta.id,
        'fecha': venta.fecha.strftime('%Y-%m-%d %H:%M:%S'),
        'total': float(venta.total),
        'pago': float(venta.pago),
        'cambio': float(venta.cambio),
        'vendedor': venta.usuario.username if venta.usuario else 'Sistema',
        'detalles': [{
            'producto_nombre': d.producto.nombre if d.producto else 'N/A',
            'cantidad': d.cantidad,
            'precio': float(d.precio),
            'subtotal': float(d.subtotal)
        } for d in detalles]
    })


@app.route('/exportar_ventas_excel')
def exportar_ventas_excel():
    if 'usuario' not in session:
        return redirect('/')
    
    ventas = Venta.query.order_by(Venta.fecha.desc()).all()
    
    data = []
    for v in ventas:
        detalles = DetalleVenta.query.filter_by(venta_id=v.id).all()
        productos_str = ", ".join([f"{d.producto.nombre} x{d.cantidad}" for d in detalles if d.producto])
        
        data.append({
            'ID': v.id,
            'Fecha': v.fecha.strftime('%Y-%m-%d %H:%M'),
            'Total': v.total,
            'Pago': v.pago,
            'Cambio': v.cambio,
            'Vendedor': v.usuario.username if v.usuario else 'Sistema',
            'Productos': productos_str
        })
    
    df = pd.DataFrame(data)
    archivo = "reporte_ventas.xlsx"
    df.to_excel(archivo, index=False)
    
    return send_file(archivo, as_attachment=True, download_name='ventas.xlsx')

@app.route('/logout' ,methods=['POST'] )
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/templates/modal.html')
def modal():
    return render_template('modal.html')

@app.route('/api/productos', methods=['GET'])
def api_get():
    productos = Producto.query.all()
    return jsonify([{
        "id": p.id,
        "nombre": p.nombre,
        "precio": p.precio
    } for p in productos])

@app.route('/api/productos/<id>', methods=['PUT'])
def api_put(id):
    p = Producto.query.get(id)
    data = request.json

    p.nombre = data['nombre']
    p.precio = data['precio']
    db.session.commit()

    return jsonify({"msg": "Actualizado"})

@app.route('/api/productos/<id>', methods=['DELETE'])
def api_delete(id):
    p = Producto.query.get(id)
    db.session.delete(p)
    db.session.commit()

    return jsonify({"msg": "Eliminado"})


if __name__ == '__main__':
    app.run(debug=True)