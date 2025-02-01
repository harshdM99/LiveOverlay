function Overlay({ text }) {
    return (
        <div className="absolute top-4 left-4 text-white text-xl font-bold bg-black bg-opacity-50 p-2 rounded">
        {text}
        </div>
    );
}

export default Overlay;