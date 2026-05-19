

# von  ~/info/gnuTemplate.gnu

#####################################################################
# dashed now explicit with dt (implicit over "dashed" + ls no longer works)
# BUG (2021, Ubuntu20): dt does not work with png (there always solid)
######################################################################

# post eps dashed no longer works but dashtype (dt) in ls
# specs! dt 1 = solid
 
set style line 1 lt 1 lw 2 pt 7 ps 1.9 dt 1 lc rgb "#000000" #schwarz, bullet
set style line 2 lt 1 lw 2 pt 9 ps 1.5 dt 1 lc rgb "#CC0022" #closedUpTriang
set style line 3 lt 1 lw 2 pt 4 ps 1.2 dt 1 lc rgb "#FF3300" #closedSquare
set style line 4 lt 1 lw 2 pt 4 ps 1.5 dt 1 lc rgb "#FFAA00" #gelb,
set style line 5 lt 1 lw 2 pt 5 ps 1.5 dt 1 lc rgb "#00DD22" #gruen,
set style line 6 lt 1 lw 2 pt 4 ps 1.5 dt 1 lc rgb "#00AAAA"
set style line 7 lt 1 lw 2 pt 4 ps 2.0 dt 7 lc rgb "#1100FF" #blau,
set style line 8 lt 1 lw 2 pt 8 ps 1.5 dt 1 lc rgb "#220088"
set style line 9 lt 1 lw 2 pt 9 ps 1.5 dt 9 lc rgb "#999999" #grau

set style line 11 lt 1 lw 6 pt 7 ps 1.9  lc rgb "#000000" 
set style line 12 lt 1 lw 6 pt 2 ps 1.5 dt 2 lc rgb "#CC0022" 
set style line 13 lt 8 lw 6 pt 4 ps 1.2  lc rgb "#FF3300"
set style line 14 lt 6 lw 6 pt 4 ps 1.5  lc rgb "#FFAA00"
set style line 15 lt 1 lw 6 pt 5 ps 1.5  lc rgb "#00DD22"
set style line 16 lt 5 lw 6 pt 7 ps 1.5  lc rgb "#00AAAA"
set style line 17 lt 1 lw 6 pt 7 ps 1.5  lc rgb "#1100FF"
set style line 18 lt 4 lw 6 pt 8 ps 1.5  lc rgb "#220088"
set style line 19 lt 7 lw 6 pt 9 ps 1.5  lc rgb "#999999"



##############################################################
# Beispiele fuer Funktionen 
##############################################################

max(x,y)    = (x>y) ? x : y
min(x,y)    = (x>y) ? y : x
round(x) = x - floor(x) < 0.5 ? floor(x) : ceil(x)

##############################################################
set term post eps enhanced color solid "Helvetica" 20
set out "takeTwo_test.eps"
print "plotting takeTwo_test.eps"
##############################################################

 
P=1.      # needed addtl power
A1=10.     # maximum power - actual power energy source 1
A2=10.     # maximum power - actual power energy source 2  (P1+P2>P)
#lambda=2  # weighting for adding source1:source2

# quadratic equation for alpha1=a1/A1, a1+a2=P, a1=increase power 1

p(A1,A2,lambda)=0.5*(A2-P+lambda*(A1+P))/(1-lambda)
a1_1(A1,A2,lambda)=(lambda==1) ? P/(1+A2/A1) :\
  (lambda==0) ? P-A2 :\
  (lambda>1e6) ? P :\
  -p(A1,A2,lambda)\
   +sqrt( (p(A1,A2,lambda))**2+lambda*P*A1/(1-lambda))

a1_2(A1,A2,lambda)=(lambda==1) ? P/(1+A2/A1) :\
  (lambda==0) ? P-A2 :\
  (lambda>1e6) ? P :\
  -p(A1,A2,lambda)\
   -sqrt( (p(A1,A2,lambda))**2+lambda*P*A1/(1-lambda))


a1(A1,A2,lambda)=\
 ((a1_1(A1,A2,lambda)>=0)&&(a1_1(A1,A2,lambda)<=P))\
 ? a1_1(A1,A2,lambda) : a1_2(A1,A2,lambda)

a2(A1,A2,lambda)=P-a1(A1,A2,lambda)

print "a1_1(A1,A2,1)=", a1_1(A1,A2,1)
print "a1_2(A1,A2,1)=", a1_2(A1,A2,1)
print "a1_1(A1,A2,1.0001)=", a1_1(A1,A2,1.0001)
print "a1_2(A1,A2,1.0001)=", a1_2(A1,A2,1.0001)
print "a1(A1,A2,1.0001)=", a1(A1,A2,1.0001)
print "a1_1(A1,A2,0.9999)=", a1_1(A1,A2,0.9999)
print "a1_2(A1,A2,0.9999)=", a1_2(A1,A2,0.9999)
print "a1(A1,A2,0.9999)=", a1(A1,A2,0.9999)


set noparam
set key

set xlabel "{/Symbol l}"
set ylabel "a_1"
set yrange [0:P]
plot[lambda=0:2]\
  a1_1(A1,A2,lambda) t "+sqrt solution" w l ls 2,\
  a1_2(A1,A2,lambda) t "-sqrt solution" w l ls 7

##############################################################
set out "takeTwo.eps"
print "plotting takeTwo.eps"
##############################################################

plot[lambda=0:2]\
  a1(A1,A2,lambda) t "a_1" w l ls 2,\
  a2(A1,A2,lambda) t "a_2" w l ls 7
















