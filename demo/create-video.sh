#!/bin/bash

# WorkLane v0.1.0 Demo Video Generator
# Creates a simple animated demo video using ffmpeg

OUTPUT="/root/projects/worklane/demo/worklane-demo.mp4"
TEMP_DIR="/root/projects/worklane/demo/temp"

mkdir -p "$TEMP_DIR"

# Colors
BG_COLOR="0x1C1C1C"
PRIMARY="0x58C4DD"
SECONDARY="0x83C167"
ACCENT="0xFFFF00"
TEXT_COLOR="white"

# Create scene 1: Title
echo "Creating Scene 1: Title..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=4" \
  -vf "drawtext=text='WorkLane':fontsize=120:fontcolor=0x58C4DD:x=(w-text_w)/2:y=(h-text_h)/2-100:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Open-Source AI Coworker Platform':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+50:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='for Teams':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2+120:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene1.mp4" 2>&1 | tail -3

# Create scene 2: Problem
echo "Creating Scene 2: Problem..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=4" \
  -vf "drawtext=text='The Problem':fontsize=72:fontcolor=0xFF6B6B:x=(w-text_w)/2:y=200:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Enterprise AI tools are closed':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=400:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Live in expensive dashboards':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=470:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Require prompt engineering':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=540:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Not self-hostable':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=610:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene2.mp4" 2>&1 | tail -3

# Create scene 3: Solution
echo "Creating Scene 3: Solution..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=4" \
  -vf "drawtext=text='The Solution':fontsize=72:fontcolor=0x83C167:x=(w-text_w)/2:y=200:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Mention AI agents in chat':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=400:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Route work automatically':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=470:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Return finished output':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=540:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Self-hostable & provider-agnostic':fontsize=40:fontcolor=white:x=(w-text_w)/2:y=610:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene3.mp4" 2>&1 | tail -3

# Create scene 4: Telegram Demo
echo "Creating Scene 4: Telegram Demo..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=5" \
  -vf "drawtext=text='Telegram Bot Demo':fontsize=72:fontcolor=0x58C4DD:x=(w-text_w)/2:y=150:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='@WorkLane summarize this discussion':fontsize=36:fontcolor=0x83C167:x=200:y=350:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='→ Routes to Summarize Workflow':fontsize=32:fontcolor=white:x=250:y=430:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='→ Uses AI Provider (OpenAI/Ollama)':fontsize=32:fontcolor=white:x=250:y=490:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='→ Returns formatted summary':fontsize=32:fontcolor=white:x=250:y=550:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='→ Extracts action items':fontsize=32:fontcolor=white:x=250:y=610:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene4.mp4" 2>&1 | tail -3

# Create scene 5: Architecture
echo "Creating Scene 5: Architecture..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=5" \
  -vf "drawtext=text='Architecture':fontsize=72:fontcolor=0xFFFF00:x=(w-text_w)/2:y=150:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='Telegram Bot | CLI | API Server':fontsize=36:fontcolor=0x58C4DD:x=(w-text_w)/2:y=300:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='↓':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=380:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Core Router':fontsize=40:fontcolor=0x83C167:x=(w-text_w)/2:y=450:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='↓':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=530:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='Agents | Workflows | Memory':fontsize=36:fontcolor=0x58C4DD:x=(w-text_w)/2:y=600:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='↓':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=680:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='AI Providers (OpenAI, Ollama, etc.)':fontsize=36:fontcolor=0xFFFF00:x=(w-text_w)/2:y=750:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene5.mp4" 2>&1 | tail -3

# Create scene 6: Features
echo "Creating Scene 6: Features..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=5" \
  -vf "drawtext=text='Features':fontsize=72:fontcolor=0x58C4DD:x=(w-text_w)/2:y=150:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='✓ 7 AI Agents':fontsize=40:fontcolor=0x83C167:x=300:y=300:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='✓ 7 Workflows':fontsize=40:fontcolor=0x83C167:x=300:y=370:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='✓ Provider-agnostic':fontsize=40:fontcolor=0x83C167:x=300:y=440:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='✓ Self-hostable':fontsize=40:fontcolor=0x83C167:x=300:y=510:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='✓ Open-source (MIT)':fontsize=40:fontcolor=0x83C167:x=300:y=580:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='✓ Local memory':fontsize=40:fontcolor=0x83C167:x=300:y=650:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='✓ CLI + Telegram + API':fontsize=40:fontcolor=0x83C167:x=300:y=720:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene6.mp4" 2>&1 | tail -3

# Create scene 7: Call to Action
echo "Creating Scene 7: Call to Action..."
ffmpeg -y -f lavfi -i "color=c=0x1C1C1C:s=1920x1080:d=4" \
  -vf "drawtext=text='Get Started':fontsize=72:fontcolor=0xFFFF00:x=(w-text_w)/2:y=200:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf,\
drawtext=text='github.com/talocode/worklane':fontsize=48:fontcolor=0x58C4DD:x=(w-text_w)/2:y=400:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,\
drawtext=text='MIT License | Built by Talocode':fontsize=36:fontcolor=white:x=(w-text_w)/2:y=550:font=Monospace:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene7.mp4" 2>&1 | tail -3

# Concatenate all scenes
echo "Concatenating scenes..."
cat > "$TEMP_DIR/concat.txt" << EOF
file 'scene1.mp4'
file 'scene2.mp4'
file 'scene3.mp4'
file 'scene4.mp4'
file 'scene5.mp4'
file 'scene6.mp4'
file 'scene7.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" -c copy "$OUTPUT" 2>&1 | tail -3

# Clean up
rm -rf "$TEMP_DIR"

echo "Demo video created: $OUTPUT"
ls -lh "$OUTPUT"
