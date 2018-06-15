
class Entity {
    constructor(vars, calculator, render) {
        this.render = render || this.default_render;
        this.calculator = calculator ? calculator(this) : undefined;
        this.RSIZE = 33;
        this.blocks = [];
        this.factor = {};
        this.noiseOffset = [
            random(-1, 1),
            random(-1, 1)
        ];
        this.decay = 0.89;
        this.variables = {
            position: [0, 0],
            rotation: 0,
            size: 1,
            radius: 150,
            distance_decay: 0
        };

        for (var i in vars) {
            this.variables[i] = vars[i];
        }

    }

    init() {
        for (var i = 0; i < le_world.length; i++) {
            var c = le_world[i];
            var d = dist(c.position[0], c.position[1], this.variables.position[0],
                this.variables.position[1]);
            this.blocks.push({
                r: d,
                block: c,
                decay:
                    pow(this.decay, d / 10)
            });
        }
        this.blocks.sort((a, b) => {
            return a.r - b.r;
        });
    }

    update(t) {
        this.calculator ? this.calculator(t) : 0;
        this.variables.radius += (simplex.noise3D(this.noiseOffset[0], this.noiseOffset[1], t) - 0.5) * 30;
        var target = 0;
        for (target = 0; target < this.blocks.length; target++) {
            if (this.blocks[target].r > this.variables.radius) {
                break;
            }
        }
        for (var i = 0; i < target; i++) {
            var b = this.blocks[i];
            var nz = (simplex.noise3D(this.noiseOffset[0] + b.block.position[1] / 1000, this.noiseOffset[1] + b.block.position[0] / 1000, t / 1) * 0.2 + 0.5);
            for (var j in this.factor) {
                b.block.aspects[j] += this.factor[j] * b.decay * nz;
            }
        }
    }
}

//renderers
{
    function render_building(t) {
        // t.default_render();
        cv.buildings.blendMode(BLEND);
        // selectedTab = 0;
        cv.buildings.push();
        cv.buildings.translate(this.variables.position[0], this.variables.position[1]);
        cv.buildings.fill(255, 100);
        cv.buildings.noStroke();
        cv.buildings.rectMode(CENTER);
        cv.buildings.rotate(radians(this.variables.rotation));
        cv.buildings.rect(0, 0, this.RSIZE, this.RSIZE);
        cv.buildings.pop();
    }

    function render_dynamic(t) {
        // t.default_render();

        cv.buildings.blendMode(BLEND);
        // selectedTab = 0;
        cv.buildings.push();
        cv.buildings.translate(this.variables.position[0], this.variables.position[1]);
        cv.buildings.fill(255);
        cv.buildings.noStroke();
        cv.buildings.rectMode(CENTER);
        cv.buildings.rotate(radians(this.variables.rotation));
        cv.buildings.rect( 0, this.RSIZE, this.RSIZE);
        cv.buildings.pop();

    }
}

//world
{

    function initWorld() {
        var all_buildings = document.querySelectorAll("#building_layout > rect, #building_layout > g > rect");
        for (var i = 0; i < all_buildings.length; i++) {
            var cur = all_buildings[i];
            var x = parseFloat(cur.getAttribute("x"));
            var y = parseFloat(cur.getAttribute("y"));
            var ctm = cur.getCTM();
            var r = decomposeMatrix(ctm).rotation;
            var p = building_layout.createSVGPoint();
            p.x = x + 33 / 2;
            p.y = y + 33 / 2;
            var np = p.matrixTransform(ctm);
            np.x *= 1;
            np.y *= 1;
            buildings.push({
                x: np.x,
                y: np.y,
                r: r
            })
            if (cur.id.trim() == "") continue;

            if (cur.id.startsWith('随意')) {
                world.push(e({
                    position: [np.x, np.y],
                    rotation: r,
                    name: j,
                    dynamic: true
                }, undefined, render_dynamic));
                changables.push(world[world.length - 1]);
            } else {
                for (var j in scores) {
                    if (cur.id.startsWith(j)) {
                        world.push(e({
                            position: [np.x, np.y],
                            rotation: r,
                            name: j,
                        }, scores[j], render_building));
                        break;
                    }
                }
            }
        }

        for (var i = 0; i < world.length; i++) {
            world[i].init();
        }
    }

    function updateWorld(t) {
        for (var i = 0; i < world.length; i++) {
            world[i].update(t);
        }
        for (var i = 0; i < world.length; i++) {
            world[i].render(world[i]);
        }
    }

}