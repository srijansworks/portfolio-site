"""Editable, original low-poly portfolio transition assets. Run in Blender via MCP."""
import bpy, math, os
from mathutils import Vector
BASE=os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
scene=bpy.data.scenes.new('Portfolio Asset Studio')
bpy.context.window.scene=scene
world=bpy.data.worlds.new('Studio daylight'); world.use_nodes=True
world.node_tree.nodes.get('Background').inputs[0].default_value=(0.7,0.75,0.8,1)
world.node_tree.nodes.get('Background').inputs[1].default_value=0.7
scene.world=world

def mat(name,color,metal=0,rough=.4,trans=0):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
 p.inputs['Base Color'].default_value=(*color,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
 if 'Transmission Weight' in p.inputs: p.inputs['Transmission Weight'].default_value=trans
 return m
white=mat('Warm ceramic white',(.86,.88,.86),.05,.28)
black=mat('Graphite polymer',(.025,.03,.033),.12,.36)
metal=mat('Brushed aluminum',(.37,.4,.42),.8,.3)
glass=mat('Optical glass',(.025,.065,.08),.35,.13)
lens=mat('Smoke lens',(.12,.19,.18),.15,.2,.25)
accent=mat('Turquoise detail',(.025,.44,.38),.2,.32)
roots={}
root=None

def finish(o,name,ma):
 o.name=name; o.parent=root; o.data.materials.append(ma)
 if o.type=='MESH':
  for p in o.data.polygons: p.use_smooth=True
 return o

def box(name,loc,scale,ma,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.scale=scale
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  m=o.modifiers.new('Machined edges','BEVEL'); m.width=bevel; m.segments=3
  bpy.ops.object.modifier_apply(modifier=m.name)
 return finish(o,name,ma)
def cyl(name,loc,r,depth,ma,rot=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=r,depth=depth,location=loc)
 o=bpy.context.object
 if rot:o.rotation_euler=rot
 return finish(o,name,ma)
def bar(name,a,b,r,ma):
 a,b=Vector(a),Vector(b); o=cyl(name,(a+b)/2,r,(b-a).length,ma); o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler(); return o
def torus(name,loc,major,minor,ma,rot=None):
 bpy.ops.mesh.primitive_torus_add(major_segments=40,minor_segments=8,location=loc,major_radius=major,minor_radius=minor)
 o=bpy.context.object
 if rot:o.rotation_euler=rot
 return finish(o,name,ma)
def start(name):
 global root
 root=bpy.data.objects.new(name,None); scene.collection.objects.link(root); roots[name]=root

start('Drone')
box('Tello fuselage',(0,0,.015),(.39,.65,.14),white,.065)
box('Battery hatch',(0,.045,.092),(.25,.40,.035),white,.025)
box('Camera housing',(0,-.325,.005),(.24,.065,.10),black,.022)
cyl('Camera bezel',(0,-.365,.005),.035,.018,metal,(math.pi/2,0,0))
cyl('Camera lens',(0,-.378,.005),.027,.013,glass,(math.pi/2,0,0))
for x in [-.44,.44]:
 for y in [-.39,.39]:
  bar('Structural arm',(x*.24,y*.38,-.015),(x,y,.0),.037,black)
  cyl('Motor can',(x,y,.015),.058,.105,black)
  cyl('Motor cap',(x,y,.071),.043,.015,metal)
  torus('Propeller safety guard',(x,y,.065),.245,.012,black)
  for side in [-1,1]:
   p=box('Propeller',(x+side*.105,y,.092),(.235,.032,.008),black,.012); p.rotation_euler.z=side*.12
  cyl('Rotor hub',(x,y,.10),.027,.025,black)
  box('Landing foot',(x,y,-.078),(.058,.06,.09),black,.015)
for i in range(5):box('Vent groove',(-.105+i*.052,.22,.112),(.022,.085,.005),black,.003)
box('Status LED',(0,.334,.018),(.035,.008,.015),accent,.003)

start('Glasses')
# Rectangular lenses with rounded acetate frames; front faces toward -Y.
for x in [-.39,.39]:
 # ring mesh in the XZ plane with rounded superellipse profile
 verts=[]; faces=[]; N=40
 for y,rx,rz in [(-.025,.34,.235),(.035,.34,.235),(-.025,.285,.18),(.035,.285,.18)]:
  for i in range(N):
   t=i*2*math.pi/N; c=math.cos(t); s=math.sin(t)
   verts.append((x+rx*math.copysign(abs(c)**.55,c),y,rz*math.copysign(abs(s)**.65,s)))
 for a,b in [(0,1),(2,3),(0,2),(1,3)]:
  for i in range(N):j=(i+1)%N; faces.append((a*N+i,a*N+j,b*N+j,b*N+i))
 mesh=bpy.data.meshes.new('Rounded acetate');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Lens frame',mesh);scene.collection.objects.link(o);finish(o,o.name,black)
 box('Tinted lens',(x,0,0),(.57,.016,.36),lens,.065)
 bar('Temple hinge',(x+math.copysign(.34,x),0,.06),(x+math.copysign(.34,x),.72,.02),.037,black)
 bar('Temple ear tip',(x+math.copysign(.34,x),.72,.02),(x+math.copysign(.30,x),.85,-.10),.034,black)
 cyl('Temple camera',(x+math.copysign(.31,x),-.04,.105),.025,.026,glass,(math.pi/2,0,0))
bar('Nose bridge',(-.09,0,.05),(.09,0,.05),.035,black)

start('Rocket')
cyl('Rocket body',(0,0,.05),.20,1.35,white)
bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.20,radius2=.02,depth=.43,location=(0,0,.94));finish(bpy.context.object,'Nose cone',white)
cyl('Service band',(0,0,-.43),.204,.13,black)
cyl('Upper seam',(0,0,.58),.204,.025,metal)
bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.11,radius2=.07,depth=.2,location=(0,0,-.72));finish(bpy.context.object,'Engine bell',metal)
for a in [0,math.pi/2,math.pi,3*math.pi/2]:
 v=[(.16,-.025,-.28),(.38,-.025,-.65),(.16,-.025,-.65),(.16,.025,-.28),(.38,.025,-.65),(.16,.025,-.65)]
 m=bpy.data.meshes.new('Fin');m.from_pydata(v,[],[(0,1,2),(3,5,4),(0,3,4,1),(1,4,5,2),(0,2,5,3)]);m.update();o=bpy.data.objects.new('Stabilizer',m);scene.collection.objects.link(o);o.rotation_euler.z=a;finish(o,'Stabilizer',black)
box('Identification panel',(0,-.202,.15),(.09,.008,.24),accent,.008)

for name,r in roots.items():
 bpy.ops.object.select_all(action='DESELECT')
 children=list(r.children_recursive)
 for o in [r]+children:o.select_set(True)
 bpy.context.view_layer.objects.active=r
 bpy.ops.export_scene.gltf(filepath=BASE+'/assets/models/'+name.lower()+'.glb',export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
 print(name,'meshes',len(children),'triangles',sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in children if o.type=='MESH'))
# Space the models in the editable studio only, after exporting centered assets.
roots['Glasses'].location.x=2.4; roots['Rocket'].location.x=-2.4
bpy.ops.object.camera_add(location=(2,-4,2.3)); camera=bpy.context.object; camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=55;scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(1,-2,3));bpy.context.object.data.energy=180;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=4
scene.render.resolution_x=1200;scene.render.resolution_y=800
bpy.ops.wm.save_as_mainfile(filepath=BASE+'/source/blender/portfolio-assets.blend')
print('Saved editable studio and three GLB exports')
