#!/usr/bin/env bash
# Regenerates the sound effects in public/sfx/ (procedural, no samples, no licenses).
# Needs ffmpeg. The generated files are committed, so this is only for tweaking them.
set -euo pipefail
cd "$(dirname "$0")/../public/sfx"
gen() { ffmpeg -v error -y -f lavfi -i "aevalsrc='$2':s=44100:d=$3" -af "$4" -ac 1 -c:a pcm_s16le "$1.wav"; }

# pop: a node or item appears (short upward blip)
gen pop "0.6*sin(2*PI*t*(320+2600*t))*exp(-38*t)" 0.14 "afade=t=out:st=0.10:d=0.04"
# whoosh: a packet or a scene change (filtered noise swell)
gen whoosh "(random(0)*2-1)*0.7*sin(PI*t/0.42)" 0.42 "highpass=f=700,lowpass=f=5200,afade=t=in:d=0.12"
# error: something breaks (two descending tones)
gen error "0.35*(sin(2*PI*220*t)+0.5*sin(2*PI*330*t))*lt(t,0.17)*exp(-5*t)+0.38*(sin(2*PI*156*t)+0.5*sin(2*PI*233*t))*gte(t,0.19)*exp(-5*(t-0.19))" 0.6 "lowpass=f=2400,afade=t=out:st=0.5:d=0.1"
# success: it works (two-note chime)
gen success "0.4*sin(2*PI*1046.5*t)*exp(-9*t)*lt(t,0.13)+0.42*sin(2*PI*1568*t)*exp(-5*(t-0.11))*gte(t,0.11)" 0.85 "afade=t=out:st=0.7:d=0.15"
# impact: big number / hook (low thump + click)
gen impact "0.9*sin(2*PI*t*(150-110*t))*exp(-7*t)+0.25*(random(0)*2-1)*exp(-45*t)" 0.7 "lowpass=f=3500,afade=t=out:st=0.6:d=0.1"

# ---- Expressive cues: only when the sound means something (set with "sfx" on a step) ----
# cash: money is being spent / a cost (cash-register "cha-ching")
gen cash "0.22*(random(0)*2-1)*exp(-60*t)+0.3*(sin(2*PI*2637*t)+0.6*sin(2*PI*3520*t)+0.35*sin(2*PI*5274*t))*exp(-14*t)*lt(t,0.14)+0.38*(sin(2*PI*3136*t)+0.6*sin(2*PI*4186*t)+0.35*sin(2*PI*6272*t))*exp(-6*(t-0.12))*gte(t,0.12)" 0.9 "highpass=f=400,afade=t=out:st=0.75:d=0.15"
# clock: waiting / a timeout running (tick-tock)
gen clock "0.5*sin(2*PI*if(lt(mod(t,0.5),0.25),2600,1900)*t)*exp(-140*mod(t,0.25))" 1.0 "highpass=f=600,afade=t=out:st=0.9:d=0.1"
# notify: a notification reaches the user (phone-style ping)
gen notify "0.32*sin(2*PI*1760*t)*exp(-10*t)*lt(t,0.1)+0.36*sin(2*PI*2349*t)*exp(-7*(t-0.09))*gte(t,0.09)" 0.6 "afade=t=out:st=0.5:d=0.1"
# alarm: an outage / incident (two-tone, short)
gen alarm "0.28*(sin(2*PI*if(lt(mod(t,0.3),0.15),880,660)*t)+0.3*sin(2*PI*3*if(lt(mod(t,0.3),0.15),880,660)*t))*min(1,t*20)" 0.9 "lowpass=f=3000,afade=t=out:st=0.75:d=0.15"
# riser: tension right before something breaks
gen riser "(0.25*(random(0)*2-1)+0.3*sin(2*PI*(200*t+300*t*t)*1))*pow(t/1.2,2)" 1.2 "highpass=f=300,afade=t=out:st=1.12:d=0.08"
# type: code being written (keyboard clicks)
gen type "0.45*(random(0)*2-1)*exp(-90*mod(t,0.1))*(0.55+0.45*pow(sin(13*t),2))" 0.8 "highpass=f=1500,lowpass=f=7000,afade=t=out:st=0.7:d=0.1"

# ---- Film look (worlds add these by themselves; see docs/FILM.md) ----
# spike: a neuron fires, as an electrode amplifier plays it (sharp click + low thump)
gen spike "0.8*(random(0)*2-1)*exp(-260*t)+0.6*sin(2*PI*t*(140-170*t))*exp(-9*t)" 0.42 "highpass=f=50,lowpass=f=6500,afade=t=out:st=0.34:d=0.08"
# tick: a small event (an input arrives, an ion passes): a soft, short click
gen tick "0.55*(random(0)*2-1)*exp(-380*t)" 0.07 "highpass=f=1400,lowpass=f=7500"
ls -la
