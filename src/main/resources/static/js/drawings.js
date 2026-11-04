window.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".drawing-card");
    cards.forEach(card => {
        const canvas = card.querySelector("canvas");
        const ctx = canvas.getContext("2d");
        const data = JSON.parse(canvas.dataset.data);

        data.forEach(obj => {
            ctx.strokeStyle = obj.color;
            ctx.fillStyle = obj.color;
            ctx.lineWidth = obj.lineWidth || 2;
            switch(obj.type){
                case "circle":
                    ctx.beginPath();
                    ctx.arc(obj.x, obj.y, obj.size/2, 0, Math.PI*2);
                    if(obj.filled) ctx.fill();
                    ctx.stroke();
                    break;
                case "square":
                    ctx.beginPath();
                    ctx.rect(obj.x, obj.y, obj.size, obj.size);
                    if(obj.filled) ctx.fill();
                    ctx.stroke();
                    break;
                case "triangle":
                    ctx.beginPath();
                    ctx.moveTo(obj.x,obj.y);
                    ctx.lineTo(obj.x+obj.size,obj.y);
                    ctx.lineTo(obj.x+obj.size/2,obj.y-obj.size);
                    ctx.closePath();
                    if(obj.filled) ctx.fill();
                    ctx.stroke();
                    break;
                case "free":
                    ctx.beginPath();
                    obj.path.forEach((p,i)=>{
                        if(i===0) ctx.moveTo(p.x,p.y);
                        else ctx.lineTo(p.x,p.y);
                    });
                    ctx.stroke();
                    break;
                case "dot":
                    ctx.beginPath();
                    ctx.arc(obj.x, obj.y, obj.size/2, 0, Math.PI*2);
                    if(obj.filled) ctx.fill();
                    else ctx.stroke();
                    break;
            }
        });
    });
});
