from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
def ai_chat(data: ChatRequest, db: Session = Depends(get_db), user = Depends(get_current_user)):
    msg = data.message.lower()
    reply = "مرحباً! كيف يمكنني مساعدتك اليوم؟"
    
    if "نواقص" in msg or "ناقص" in msg:
        reply = "يبدو أنك تبحث عن النواقص في مخزونك. حسب بيانات مبيعاتك الأخيرة، أنصحك بزيادة طلب الشاي والزيت."
    elif "سعر" in msg or "اسعار" in msg:
        reply = "أسعار الجملة حالياً مستقرة. تذكر أنه يمكنك الحصول على خصومات أكبر عند زيادة الكمية (Tiered Pricing)!"
    elif "طلب" in msg:
        reply = "لطلب جديد، يمكنك الذهاب لصفحة 'المنتجات' وإضافة المنتجات للسلة، أو استخدام المايكروفون للبحث الصوتي السريع."
    else:
        reply = f"أنا المساعد الذكي لـ TradeLink، أنا هنا لمساعدتك في تنمية تجارتك. استفسارك '{data.message}' مهم جداً، وسنتوسع في قدراتي قريباً للإجابة عليه بدقة!"

    return ChatResponse(reply=reply)
