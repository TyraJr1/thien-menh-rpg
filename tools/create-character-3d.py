"""Rebuild the two original prototype GLB rigs with only the Python stdlib."""
from array import array
import json
import math
from pathlib import Path
import struct

RIG = [
    ('hips',None,(0,1,0)), ('spine',0,(0,1.2,0)), ('head',1,(0,1.64,.02)),
    ('arm.L',1,(.245,1.44,0)), ('forearm.L',3,(.317,1.15,0)),
    ('arm.R',1,(-.245,1.44,0)), ('forearm.R',5,(-.317,1.15,0)),
    ('leg.L',0,(.108,.94,0)), ('shin.L',7,(.108,.48,0)),
    ('leg.R',0,(-.108,.94,0)), ('shin.R',9,(-.108,.48,0)),
    ('ponytail',2,(0,1.81,-.125)), ('coat.L',0,(.11,.91,0)), ('coat.R',0,(-.11,.91,0)),
]
CLIPS={'Idle':2.45,'Walk':.89,'Run':.64,'Jump':.68,'Land':.27,'Dodge':.42,'Slash':.52,'Sweep':.66}
def minus(a,b):
    return tuple(x-y for x,y in zip(a,b))
def cross(a,b):
    return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def unit(v):
    return tuple(x/(math.hypot(*v) or 1) for x in v)
def color(h):
    return tuple((int(h[i:i+2],16)/255)**2.14 for i in (0,2,4))

class Rig:
    def __init__(self):
        self.p,self.n,self.c,self.j,self.w=[array('f') for _ in range(3)]+[array('H'),array('f')]
        self.data=bytearray()
        self.views,self.accessors=[],[]

    def tri(self,a,b,c,tint,joint):
        normal=unit(cross(minus(b,a),minus(c,a)))
        joints, weights=((joint[0],joint[1],0,0),(joint[2],1-joint[2],0,0)) if isinstance(joint,tuple) else ((joint,0,0,0),(1,0,0,0))
        for point in (a,b,c):
            self.p.extend(point);self.n.extend(normal);self.c.extend(tint)
            self.j.extend(joints);self.w.extend(weights)

    def rings(self, rows, shade, joint, sides=12, arc=(0,math.tau)):
        def v(r,a):
            x,y,z,rx,rz=r
            return (x+rx*math.cos(a),y,z+rz*math.sin(a))
        tint=color(shade)
        for r,(lo,hi) in enumerate(zip(rows,rows[1:])):
            for i in range(sides):
                a=arc[0]+(arc[1]-arc[0])*i/sides
                b=arc[0]+(arc[1]-arc[0])*(i+1)/sides
                c=tuple(x*(.84+.19*((i*7+r*3)%11)/10) for x in tint)
                self.tri(v(lo,a),v(hi,a),v(hi,b),c,joint)
                self.tri(v(lo,a),v(hi,b),v(lo,b),c,joint)

    def oval(self,p,r,shade,joint,rows=7,sides=10):
        x,y,z=p; rx,ry,rz=r
        self.rings([(x,y-ry*math.cos(math.pi*i/rows),z,rx*max(.01,math.sin(math.pi*i/rows)),
                     rz*max(.01,math.sin(math.pi*i/rows))) for i in range(rows+1)],shade,joint,sides)

    def rod(self,a,b,rad1,rad2,shade,joint,sides=7):
        axis=unit(minus(b,a))
        u=unit(cross(axis,(0,1,0) if abs(axis[1])<.90 else (0,0,1)))
        v=cross(u,axis)
        def point(p,r,i):
            angle=i*math.tau/sides
            return tuple(x+r*(math.cos(angle)*y+math.sin(angle)*z) for x,y,z in zip(p,u,v))
        c=color(shade)
        for i in range(sides):
            self.tri(point(a,rad1,i),point(b,rad2,i),point(b,rad2,i+1),c,joint)
            self.tri(point(a,rad1,i),point(b,rad2,i+1),point(a,rad1,i+1),c,joint)

    def put(self,values,kind,typ='f',**extra):
        while len(self.data)%4: self.data.append(0)
        data=array(typ,values)
        self.views.append(dict(buffer=0,byteOffset=len(self.data),byteLength=len(data)*data.itemsize))
        self.data.extend(data.tobytes())
        self.accessors.append(dict(bufferView=len(self.views)-1,type=kind,
            componentType=5126 if typ=='f' else 5123,count=len(data)//{'SCALAR':1,'VEC3':3,'VEC4':4,'MAT4':16}[kind],**extra))
        return len(self.accessors)-1

    def write(self,path):
        bounds=[self.p[i::3] for i in range(3)]
        attrs={'POSITION':self.put(self.p,'VEC3',min=list(map(min,bounds)),max=list(map(max,bounds))),
            'NORMAL':self.put(self.n,'VEC3'),'COLOR_0':self.put(self.c,'VEC3'),
            'JOINTS_0':self.put(self.j,'VEC4','H'),'WEIGHTS_0':self.put(self.w,'VEC4')}
        nodes=[dict(name=path.stem,mesh=0,skin=0)]
        matrices=[]
        for i,(name,parent,xyz) in enumerate(RIG):
            children=[j+1 for j,(_,p,_) in enumerate(RIG) if p==i]
            item=dict(name=name,translation=xyz if parent is None else minus(xyz,RIG[parent][2]))
            if children:item['children']=children
            nodes.append(item)
            x,y,z=xyz
            matrices.extend([1,0,0,0,0,1,0,0,0,0,1,0,-x,-y,-z,1])
        inverse=self.put(matrices,'MAT4')
        animations=[]
        for name,duration in CLIPS.items():
            channels,samplers=[],[]
            times=self.put([i*duration/12 for i in range(13)],'SCALAR',min=[0],max=[duration])
            for j in range(len(RIG)):
                vals=[]
                for i in range(13):
                    out=pose(name,j,i/12)
                    if j==0:vals.extend((0,1+out,0))
                    else:
                        axis,a=out
                        vals.extend([*(math.sin(a/2)*v for v in axis),math.cos(a/2)])
                output=self.put(vals,'VEC4' if j else 'VEC3')
                channels.append(dict(sampler=j,target=dict(node=j+1,path='rotation' if j else 'translation')))
                samplers.append(dict(input=times,output=output,interpolation='LINEAR'))
            animations.append(dict(name=name,channels=channels,samplers=samplers))
        doc=dict(asset=dict(version='2.0',generator='Original Thiên Mệnh rig'),
            scene=0,scenes=[dict(nodes=[0,1])],nodes=nodes,
            meshes=[dict(primitives=[dict(attributes=attrs,material=0)])],
            materials=[dict(name='Cloth and ink',doubleSided=True,pbrMetallicRoughness=dict(metallicFactor=0,roughnessFactor=.82))],
            skins=[dict(skeleton=1,joints=list(range(1,len(nodes))),inverseBindMatrices=inverse)],
            accessors=self.accessors,bufferViews=self.views,animations=animations,buffers=[dict(byteLength=len(self.data))])
        raw=json.dumps(doc,separators=(',',':')).encode()
        raw+=b' '*(-len(raw)%4)
        self.data.extend(b'\0'*(-len(self.data)%4))
        path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(raw)+len(self.data))
                         +struct.pack('<I4s',len(raw),b'JSON')+raw
                         +struct.pack('<I4s',len(self.data),b'BIN\0')+self.data)

def pose(name,j,u):
    x,y,z=(1,0,0),(0,1,0),(0,0,1)
    s=math.sin(math.tau*u); p=math.sin(math.pi*u)
    if not j:
        if name in ('Walk','Run'):return (.016 if name=='Walk' else .028)*(1-math.cos(math.tau*u*2))
        return {'Idle':.006*s,'Jump':-.065*p,'Land':-.13*p,'Dodge':-.31*p,'Slash':-.045*p,'Sweep':-.075*p}.get(name,0)
    if name in ('Walk','Run'):
        k=.63 if name=='Run' else .42
        return x,{1:-.09 if name=='Run' else -.02,2:.018*s,3:-.70*k*s,4:-.16,5:.68*k*s,6:-.19,
            7:k*s,8:1.55*k*max(0,-s),9:-k*s,10:1.55*k*max(0,s),11:.16*s,12:.30*k*s,13:-.30*k*s}.get(j,0)
    if name in ('Jump','Land','Dodge'):
        k=1.35 if name=='Dodge' else 1
        return x,p*k*{1:-.29,3:-.62,5:-.39,7:-.49,8:.90,9:-.28,10:.63,11:-.42,12:-.26,13:-.2}.get(j,0)
    if name in ('Slash','Sweep'):
        swing=p*math.sin((u-.20)*math.pi*1.27)
        if j==1:return y,swing*(1.1 if name=='Sweep' else .75)
        if j==5:return z,-1.25*p
        return x,p*{3:-.29,6:.87*swing,7:-.31,9:.19,11:-.34}.get(j,0)
    return x,s*{1:.025,2:.024,3:.021,5:.022,11:.15}.get(j,0)

def character(ferryman):
    m=Rig()
    cloth,shadow,satin=('74513e','493b32','a27d55') if ferryman else ('2b6669','1d424a','4b8b83')
    gold,skin,hair,ivory='cca873',('be8e69' if ferryman else 'e5b58a'),'1d252a','dcd4b4'
    m.rings([(0,1,0,.17,.116),(0,1.16,0,.175,.135),(0,1.40,0,.253,.151),(0,1.47,0,.224,.137),(0,1.56,.004,.087,.074)],cloth,1,16)
    m.rings([(0,1.33,.005,.159,.152),(0,1.55,.013,.080,.082)],ivory,1,8,(.75,2.25))
    m.rod((-.106,1.55,.064),(.084,1.31,.137),.018,.015,gold,1)
    m.rod((.117,1.54,.062),(-.044,1.30,.143),.017,.013,shadow,1)
    for sign,j in [(1,12),(-1,13)]:
        a=(-1.66,1.67) if sign>0 else (1.49,4.80)
        m.rings([(sign*.016,.50,-.018,.241,.172),(0,.73,0,.201,.159),(0,1.15,0,.174,.137)],cloth,(j,0,.69),10,a)
        m.rings([(sign*.016,.494,-.019,.242,.175),(sign*.015,.527,-.019,.241,.173)],gold,(j,0,.69),10,a)
        m.rings([(sign*.011,.43,-.015,.166,.139),(0,.80,.005,.165,.14),(0,1.08,.004,.164,.13)],shadow,j,8,a)
    m.rings([(0,1.03,0,.179,.144),(0,1.12,0,.184,.152),(0,1.15,0,.177,.148)],'725446',0,14)
    m.rings([(0,1.084,0,.186,.154),(0,1.104,0,.184,.155)],gold,0,14)
    m.oval((.014,1.098,.16),(.050,.036,.014),gold,0,4,8)
    m.rod((.086,1.09,.136),(.12,.79,.142),.014,.006,'658c71',12)
    m.oval((.119,.79,.145),(.027,.045,.028),'6b9e87',12,5,6)
    for s,arm,fore,leg,shin in [(1,3,4,7,8),(-1,5,6,9,10)]:
        m.oval((s*.246,1.419,0),(.112,.12,.107),satin,arm,6)
        m.rings([(s*.314,1.133,0,.100,.101),(s*.29,1.29,0,.112,.105),(s*.242,1.459,0,.10,.101)],cloth,arm)
        m.rings([(s*.319,.986,.02,.104,.105),(s*.321,1.082,.01,.121,.112),(s*.311,1.17,0,.10,.104)],shadow,fore)
        m.rings([(s*.320,.973,.02,.105,.108),(s*.319,1.012,.02,.108,.107)],gold,fore)
        m.oval((s*.322,.936,.038),(.057,.073,.052),skin,fore,5)
        m.rings([(s*.109,.44,0,.069,.076),(s*.109,.69,0,.089,.091),(s*.108,.98,0,.098,.10)],'333334',leg)
        m.rings([(s*.109,.087,.01,.059,.071),(s*.109,.28,.01,.072,.074),(s*.109,.495,0,.073,.079)],'363b3b',shin)
        for height in [.27,.315,.36,.408]:
            m.rings([(s*.109,height,.01,.075,.081),(s*.109,height+.017,.01,.076,.082)],'71877b',shin,10)
        m.oval((s*.108,.076,.061),(.078,.075,.134),'1e292b',shin,6)
    m.oval((0,1.575,.023),(.060,.085,.064),skin,2)
    m.rings([(0,1.598,.031,.047,.055),(0,1.665,.017,.102,.091),(0,1.748,.012,.113,.102),
        (0,1.829,.010,.109,.094),(0,1.898,-.003,.046,.051)],skin,2,16)
    for s in [-1,1]:
        m.oval((s*.108,1.712,.022),(.019,.030,.022),skin,2,4)
        m.oval((s*.042,1.741,.105),(.029,.010,.009),'eee4d6',2,4)
        m.oval((s*.043,1.740,.114),(.011,.009,.006),'262a29',2,5)
        m.rod((s*.016,1.761,.116),(s*.068,1.766,.093),.005,.004,hair,2)
        m.oval((s*.084,1.792,.083),(.033,.093,.041),hair,2,5)
    m.oval((0,1.717,.119),(.017,.025,.025),skin,2,6)
    m.rod((-.023,1.669,.101),(.026,1.669,.102),.004,.004,'875a49',2)
    m.rings([(0,1.648,-.022,.108,.111),(0,1.76,-.013,.116,.118),(0,1.855,.005,.115,.111),
             (0,1.93,-.016,.067,.067),(0,1.95,-.025,.013,.013)],hair,2,15,(2.40,6.9))
    m.oval((0,1.914,-.089),(.067,.061,.070),hair,2,6)
    m.rings([(0,1.897,-.089,.068,.068),(0,1.912,-.089,.069,.069)],gold,2)
    m.rings([(-.038,1.22,-.19,.01,.014),(-.026,1.40,-.172,.037,.028),(0,1.58,-.139,.050,.033),
             (0,1.84,-.117,.038,.033)],hair,11,10)
    if ferryman:
        m.oval((0,1.631,.087),(.071,.041,.045),'606261',2,5)
        m.rings([(0,1.829,0,.313,.283),(0,1.851,0,.304,.263),(0,1.968,0,.143,.126),
                 (0,2.046,0,.056,.048),(0,2.056,0,.002,.002)],'a48348',2,27)
        m.rings([(0,1.825,0,.314,.284),(0,1.845,0,.317,.286)],'66563d',2,27)
        m.rod((.349,.08,.064),(.353,1.48,.085),.025,.022,'755b3d',4)
    else:
        a,b=(.40,.52,-.142),(-.279,1.61,-.159)
        m.rod(a,b,.032,.040,'2a3c45',1)
        m.rod(a,(.361,.585,-.142),.038,.034,gold,1)
        m.rod((-.229,1.531,-.157),(-.299,1.649,-.161),.041,.046,gold,1)
        m.rod(b,(-.410,1.81,-.161),.025,.027,'45685e',1)
        m.rod((-.388,1.791,-.160),(-.416,1.83,-.161),.028,.032,gold,1)
        m.rod((-.345,1.625,-.160),(-.215,1.678,-.160),.027,.024,gold,1)
        m.rod((-.162,1.462,.142),(.157,1.102,.135),.019,.020,'765b46',1)
    return m

if __name__=='__main__':
    out=Path(__file__).resolve().parents[1]/'src/three/assets'
    out.mkdir(parents=True,exist_ok=True)
    character(False).write(out/'wanderer.glb')
    character(True).write(out/'ferryman.glb')
